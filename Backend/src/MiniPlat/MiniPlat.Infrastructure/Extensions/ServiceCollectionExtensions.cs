using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Infrastructure.Interceptors;
using MiniPlat.Infrastructure.Repositories;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddAppDbContext(configuration)
            .AddOpenIddictServer()
            .AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // AddIdentity defaults these to the Identity cookie schemes, which leaves HttpContext.User
        // anonymous on endpoints that carry no [Authorize] attribute - the public subject reads
        // among them. Those endpoints still need to know who is asking, so that a lecturer sees the
        // hidden topics on their own subject while a student does not.
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
        });

        services.AddScoped<ILecturersRepository, LecturersRepository>();
        services.AddScoped<ISubjectsRepository, SubjectsRepository>();

        return services;
    }

    private static IServiceCollection AddAppDbContext(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
            options.UseOpenIddict();
        });

        return services;
    }

    private static IServiceCollection AddOpenIddictServer(this IServiceCollection services)
    {
        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                    .UseDbContext<AppDbContext>();
            })
            .AddServer(options =>
            {
                options.RegisterScopes(
                    OpenIddictConstants.Scopes.OpenId,
                    OpenIddictConstants.Scopes.Email,
                    OpenIddictConstants.Scopes.Profile,
                    OpenIddictConstants.Scopes.OfflineAccess,
                    "api");

                options
                    .SetAccessTokenLifetime(TimeSpan.FromMinutes(60))
                    .SetRefreshTokenLifetime(TimeSpan.FromDays(14))
                    .UseReferenceRefreshTokens();

                options.RegisterClaims(
                    OpenIddictConstants.Claims.Email,
                    OpenIddictConstants.Claims.Name,
                    OpenIddictConstants.Claims.Role,
                    "firstName",
                    "lastName");

                options.SetTokenEndpointUris("/api/Auth/Token");
                options.SetUserInfoEndpointUris("/api/Auth/UserInfo");

                options.AllowPasswordFlow();
                options.AllowRefreshTokenFlow();
                options.AcceptAnonymousClients();

                options.AddEphemeralEncryptionKey()
                    .AddEphemeralSigningKey();

                options.UseAspNetCore()
                    .EnableTokenEndpointPassthrough()
                    .EnableUserInfoEndpointPassthrough();
            })
            .AddValidation(options =>
            {
                options.UseLocalServer();
                options.UseAspNetCore();
            });

        return services;
    }
    
    public static IServiceCollection AddInterceptors(this IServiceCollection services)
    {
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        return services;
    }
}