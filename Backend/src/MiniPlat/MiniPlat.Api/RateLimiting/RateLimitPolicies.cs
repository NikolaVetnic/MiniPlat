using System.Globalization;
using System.Threading.RateLimiting;

namespace MiniPlat.Api.RateLimiting;

public static class RateLimitPolicies
{
    /// <summary>Stricter budget for the token endpoint, where a request is a password guess.</summary>
    public const string Authentication = "authentication";

    public static IServiceCollection AddMiniPlatRateLimiting(this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configurable, because the right numbers depend on how the platform is reached. A school
        // sits behind one public address, so every student there shares a partition: sized for a
        // single visitor these limits would lock out a whole class.
        var global = Window(configuration, "RateLimiting:Global", permitLimit: 1200);
        var authentication = Window(configuration, "RateLimiting:Authentication", permitLimit: 30);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => global));

            options.AddPolicy(Authentication, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientKey(context), _ => authentication));

            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(NumberFormatInfo.InvariantInfo);

                // Logged with the partition key: if rejections all name the proxy's address, the
                // forwarded headers are not being honoured and everyone is sharing one budget.
                context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger(typeof(RateLimitPolicies))
                    .LogWarning("Rate limit reached for partition {Partition} on {Path}",
                        ClientKey(context.HttpContext), context.HttpContext.Request.Path);

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { title = "Too many requests", status = StatusCodes.Status429TooManyRequests },
                    cancellationToken);
            };
        });

        return services;
    }

    private static FixedWindowRateLimiterOptions Window(IConfiguration configuration, string section, int permitLimit)
    {
        var options = configuration.GetSection(section);

        return new FixedWindowRateLimiterOptions
        {
            PermitLimit = options.GetValue<int?>("PermitLimit") ?? permitLimit,
            Window = TimeSpan.FromSeconds(options.GetValue<int?>("WindowSeconds") ?? 60),
            QueueLimit = 0
        };
    }

    /// <summary>
    /// Partitions on the caller's address. UseForwardedHeaders runs first, so behind the proxy
    /// this is the real client - provided the proxy is covered by ForwardedHeaders:KnownNetworks.
    /// </summary>
    private static string ClientKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
