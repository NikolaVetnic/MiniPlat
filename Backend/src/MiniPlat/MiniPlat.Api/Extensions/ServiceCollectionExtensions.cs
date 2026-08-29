using MiniPlat.Api.Authorization;
using MiniPlat.Api.RateLimiting;

namespace MiniPlat.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthorization(options => options.AddMiniPlatPolicies());
        services.AddMiniPlatRateLimiting();

        return services;
    }
}