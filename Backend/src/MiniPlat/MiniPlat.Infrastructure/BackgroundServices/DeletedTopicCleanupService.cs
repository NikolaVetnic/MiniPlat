using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MiniPlat.Infrastructure.BackgroundServices;

/// <summary>
/// Removes topics that have sat marked for deletion longer than the retention period.
///
/// The lecturer handbook tells staff a deleted topic stays recoverable for a few days and is
/// then gone for good. Nothing was carrying out the second half of that promise - deleted
/// topics simply accumulated forever.
/// </summary>
public class DeletedTopicCleanupService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<DeletedTopicCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = configuration.GetSection("TopicCleanup");

        if (options.GetValue<bool?>("Enabled") == false)
        {
            logger.LogInformation("Deleted topic cleanup is switched off.");
            return;
        }

        var retention = TimeSpan.FromDays(options.GetValue<double?>("RetentionDays") ?? 7);
        var interval = TimeSpan.FromHours(options.GetValue<double?>("IntervalHours") ?? 24);

        logger.LogInformation(
            "Deleted topic cleanup running every {Interval}, removing topics deleted more than {Retention} ago.",
            interval, retention);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RemoveExpiredTopics(retention, stoppingToken);
            }
            catch (Exception exception)
            {
                // Logged and swallowed on purpose: a bad run must not take the loop down with it.
                logger.LogError(exception, "Deleted topic cleanup failed; will try again next run.");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return; // shutting down
            }
        }
    }

    private async Task RemoveExpiredTopics(TimeSpan retention, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cutoff = DateTime.UtcNow - retention;

        // ExecuteDelete issues one statement and skips the change tracker; the materials go with
        // the topics through the cascade already configured on the foreign key.
        var removed = await context.Topics
            .Where(topic => topic.IsDeleted && topic.DeletedAt != null && topic.DeletedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (removed > 0)
            logger.LogInformation("Permanently removed {Count} topic(s) deleted before {Cutoff}.", removed, cutoff);
    }
}
