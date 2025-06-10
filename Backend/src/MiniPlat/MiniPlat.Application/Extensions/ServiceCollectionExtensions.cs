using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Application.Behaviors;
using MiniPlat.Application.Data;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            config.AddOpenBehavior(typeof(ValidationBehavior<,>));
            config.AddOpenBehavior(typeof(LoggingBehavior<,>));
        });
        
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddHttpContextAccessor();  
        
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<ITokenService, TokenService>();
        
        return services;
    }
}