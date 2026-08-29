using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Infrastructure;
using MiniPlat.Infrastructure.BackgroundServices;
using MiniPlat.Infrastructure.Interceptors;

namespace MiniPlat.IntegrationTests.BackgroundServices;

/// <summary>
/// The lecturer handbook promises a deleted topic stays recoverable for a few days and is then
/// gone for good. This is the half of that promise that runs on its own.
/// </summary>
public class DeletedTopicCleanupServiceTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    private DeletedTopicCleanupService Service(params (string Key, string? Value)[] settings)
    {
        var services = new ServiceCollection()
            .AddScoped<ICurrentUser>(_ => new TestCurrentUser())
            .AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>()
            .AddDbContext<AppDbContext>(options => options
                .UseNpgsql(Fixture.RepositoryConnectionString)
                .UseOpenIddict())
            .BuildServiceProvider();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings.Select(setting =>
                new KeyValuePair<string, string?>(setting.Key, setting.Value)))
            .Build();

        return new DeletedTopicCleanupService(
            services.GetRequiredService<IServiceScopeFactory>(),
            configuration,
            NullLogger<DeletedTopicCleanupService>.Instance);
    }

    private async Task<string[]> RemainingTopics()
    {
        await using var context = NewDbContext();

        return await context.Topics.OrderBy(topic => topic.Title).Select(topic => topic.Title).ToArrayAsync();
    }

    /// <summary>
    /// Runs the loop until the expired topics are gone, then stops it. Waiting on the effect
    /// rather than on a delay keeps this from turning into a race the suite has to tolerate.
    /// </summary>
    private async Task RunUntil(DeletedTopicCleanupService service, Func<Task<bool>> done)
    {
        await service.StartAsync(CancellationToken.None);

        try
        {
            var deadline = DateTime.UtcNow.AddSeconds(30);

            while (!await done())
            {
                if (DateTime.UtcNow > deadline)
                    throw new TimeoutException("The cleanup pass did not finish in time.");

                await Task.Delay(50);
            }
        }
        finally
        {
            await service.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task A_topic_deleted_longer_ago_than_the_retention_period_is_removed_for_good()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10))
        ]));

        var service = Service(("TopicCleanup:RetentionDays", "7"), ("TopicCleanup:IntervalHours", "24"));

        await RunUntil(service, async () => (await RemainingTopics()).Length == 0);
    }

    /// <summary>
    /// The two cases in one pass: once the expired topic is gone the pass has run, so what is
    /// left is what the service deliberately kept.
    /// </summary>
    [Fact]
    public async Task A_topic_still_inside_its_retention_period_is_kept()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10)),
            Some.Topic(title: "Recent", isDeleted: true, deletedAt: DateTime.UtcNow.AddHours(-1))
        ]));

        var service = Service(("TopicCleanup:RetentionDays", "7"));

        await RunUntil(service, async () => !(await RemainingTopics()).Contains("Expired"));

        Assert.Equal(["Recent"], await RemainingTopics());
    }

    [Fact]
    public async Task A_topic_nobody_deleted_is_never_touched()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10)),
            Some.Topic(title: "Live")
        ]));

        var service = Service(("TopicCleanup:RetentionDays", "7"));

        await RunUntil(service, async () => !(await RemainingTopics()).Contains("Expired"));

        Assert.Equal(["Live"], await RemainingTopics());
    }

    /// <summary>
    /// A topic marked deleted before the retention clock existed has no DeletedAt. It is left
    /// alone rather than removed on the spot, which would delete on sight everything that was
    /// already in the bin when the feature shipped.
    /// </summary>
    [Fact]
    public async Task A_topic_deleted_without_a_recorded_time_is_left_alone()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10)),
            Some.Topic(title: "No timestamp", isDeleted: true, deletedAt: null)
        ]));

        var service = Service(("TopicCleanup:RetentionDays", "7"));

        await RunUntil(service, async () => !(await RemainingTopics()).Contains("Expired"));

        Assert.Equal(["No timestamp"], await RemainingTopics());
    }

    [Fact]
    public async Task The_materials_of_a_removed_topic_go_with_it()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10),
                materials: [Some.Material(), Some.Material()])
        ]));

        var service = Service(("TopicCleanup:RetentionDays", "7"));

        await RunUntil(service, async () => (await RemainingTopics()).Length == 0);

        await using var context = NewDbContext();

        Assert.Empty(await context.Materials.ToListAsync());
    }

    [Fact]
    public async Task The_subject_itself_survives_losing_a_topic()
    {
        var subject = Some.Subject(code: "MP101", topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10))
        ]);
        await Store(subject);

        var service = Service(("TopicCleanup:RetentionDays", "7"));

        await RunUntil(service, async () => (await RemainingTopics()).Length == 0);

        Assert.Equal("MP101", (await Reload(subject.Id)).Code);
    }

    /// <summary>
    /// Switched off, the loop returns before it reads anything - so nothing is removed, and
    /// StartAsync has already run it to completion by the time it returns.
    /// </summary>
    [Fact]
    public async Task Nothing_is_removed_when_the_cleanup_is_switched_off()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-10))
        ]));

        var service = Service(("TopicCleanup:Enabled", "false"), ("TopicCleanup:RetentionDays", "7"));

        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(["Expired"], await RemainingTopics());
    }

    /// <summary>
    /// Unconfigured, the retention period is a week. A topic deleted a day ago survives a default
    /// run, which is what makes "recoverable for a few days" true without anyone setting anything.
    /// </summary>
    [Fact]
    public async Task The_retention_period_defaults_to_a_week()
    {
        await Store(Some.Subject(topics:
        [
            Some.Topic(title: "Expired", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-8)),
            Some.Topic(title: "Yesterday", isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-1))
        ]));

        var service = Service();

        await RunUntil(service, async () => !(await RemainingTopics()).Contains("Expired"));

        Assert.Equal(["Yesterday"], await RemainingTopics());
    }
}
