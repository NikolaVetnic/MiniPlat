using System.Globalization;
using System.Threading.RateLimiting;

namespace MiniPlat.Api.RateLimiting;

public static class RateLimitPolicies
{
    /// <summary>Stricter budget for the token endpoint, where a request is a password guess.</summary>
    public const string Authentication = "authentication";

    public static IServiceCollection AddMiniPlatRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // The subject list plus one lecturer lookup per card means a single page load is
            // already tens of requests, so the general budget is loose. It exists to make bulk
            // scraping of the public reads impractical, not to police normal browsing.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 240,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

            options.AddPolicy(Authentication, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(NumberFormatInfo.InvariantInfo);

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { title = "Too many requests", status = StatusCodes.Status429TooManyRequests },
                    cancellationToken);
            };
        });

        return services;
    }

    /// <summary>
    /// Partitions on the caller's address. UseForwardedHeaders runs first, so behind the nginx
    /// proxy this is the real client rather than the proxy itself.
    /// </summary>
    private static string ClientKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
