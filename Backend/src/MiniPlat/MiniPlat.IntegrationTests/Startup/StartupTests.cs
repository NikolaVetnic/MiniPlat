using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Infrastructure.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Infrastructure;
using MiniPlat.Infrastructure.Extensions;

namespace MiniPlat.IntegrationTests.Startup;

[Collection(MiniPlatCollection.Name)]
public class StartupTests(MiniPlatFixture fixture)
{
    [Fact]
    public async Task Every_migration_in_the_repository_has_been_applied()
    {
        using var scope = fixture.ApiServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Empty(await context.Database.GetPendingMigrationsAsync());
        Assert.NotEmpty(await context.Database.GetAppliedMigrationsAsync());
    }

    [Fact]
    public async Task The_seeded_catalogue_is_there()
    {
        using var scope = fixture.ApiServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var codes = await context.Subjects.AsNoTracking().Select(subject => subject.Code).ToListAsync();

        Assert.Contains("PED-001", codes);
        Assert.Contains("KNJ-001", codes);
    }

    [Fact]
    public async Task The_admin_account_exists_and_holds_the_admin_role()
    {
        using var scope = fixture.ApiServices.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var admin = await users.FindByNameAsync(MiniPlatFixture.AdminUsername);

        Assert.NotNull(admin);
        Assert.True(await users.IsInRoleAsync(admin, Roles.Admin));
    }
}

/// <summary>
/// Migrating and seeding a database that has never been touched, which is what the first
/// deployment of the platform does. It runs against a database of its own, and is configured by
/// hand rather than through the API host - so a developer's own gitignored appsettings.override
/// cannot fill in a setting that a fresh checkout would not have.
/// </summary>
[Collection(MiniPlatCollection.Name)]
public class SeedingFromScratchTests(MiniPlatFixture fixture)
{
    private ServiceProvider BuildHost(params (string Key, string? Value)[] settings)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings.Select(setting =>
                new KeyValuePair<string, string?>(setting.Key, setting.Value)))
            .Build();

        var services = new ServiceCollection();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging();
        services.AddScoped<ICurrentUser>(_ => new TestCurrentUser());
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        services.AddDbContext<AppDbContext>(options => options
            .UseNpgsql(fixture.VirginConnectionString)
            .UseOpenIddict());
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        return services.BuildServiceProvider();
    }

    /// <summary>
    /// appsettings.json carries Seed:FileName as an empty string rather than leaving the key out,
    /// and an empty string is a value - so a null-coalescing fallback never fires and the seeder
    /// goes looking for a file called "". A checkout without the gitignored override file could
    /// not start at all. Passed in outright here, because that is what a clean checkout has.
    /// </summary>
    [Fact]
    public async Task A_virgin_database_is_migrated_and_seeded_with_nothing_configured_but_the_admin_password()
    {
        await using var host = BuildHost(
            ("Seed:FileName", string.Empty),
            ("Seed:AdminUsername", string.Empty),
            ("Seed:AdminPassword", MiniPlatFixture.AdminPassword));

        await host.MigrateAndSeedDatabaseAsync();

        using var scope = host.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Empty(await context.Database.GetPendingMigrationsAsync());
        Assert.Contains("PED-001",
            await context.Subjects.AsNoTracking().Select(subject => subject.Code).ToListAsync());
        Assert.NotEmpty(await context.Lecturers.AsNoTracking().ToListAsync());
    }

    /// <summary>
    /// Seeding is written to be repeatable, because it runs on every start of every replica.
    /// </summary>
    [Fact]
    public async Task Seeding_the_same_database_again_changes_nothing()
    {
        await using var host = BuildHost(
            ("Seed:FileName", "initialData.yml"),
            ("Seed:AdminPassword", MiniPlatFixture.AdminPassword));

        await host.MigrateAndSeedDatabaseAsync();

        using var scope = host.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var subjects = await context.Subjects.AsNoTracking().CountAsync();
        var users = await context.Users.AsNoTracking().CountAsync();

        await host.MigrateAndSeedDatabaseAsync();

        Assert.Equal(subjects, await context.Subjects.AsNoTracking().CountAsync());
        Assert.Equal(users, await context.Users.AsNoTracking().CountAsync());
    }

    /// <summary>
    /// The account named by Seed:AdminUsername is the one granted the role, and the seed file's
    /// own placeholder password for it is not one Identity accepts - so a deployment that does
    /// not choose a password is refused rather than given an administrator with a known one.
    /// </summary>
    [Fact]
    public async Task The_seeded_administrator_gets_the_password_that_was_configured_for_them()
    {
        await using var host = BuildHost(
            ("Seed:FileName", "initialData.yml"),
            ("Seed:AdminUsername", MiniPlatFixture.AdminUsername),
            ("Seed:AdminPassword", MiniPlatFixture.AdminPassword));

        await host.MigrateAndSeedDatabaseAsync();

        using var scope = host.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var admin = await users.FindByNameAsync(MiniPlatFixture.AdminUsername);

        Assert.NotNull(admin);
        Assert.True(await users.CheckPasswordAsync(admin, MiniPlatFixture.AdminPassword));
        Assert.True(await users.IsInRoleAsync(admin, Roles.Admin));
    }
}
