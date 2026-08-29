using MiniPlat.Api.Authorization;

namespace MiniPlat.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthorization(options => options.AddMiniPlatPolicies());

        return services;
    }
}
