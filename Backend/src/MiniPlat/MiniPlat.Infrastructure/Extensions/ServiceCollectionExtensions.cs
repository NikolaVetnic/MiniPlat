using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Infrastructure.Interceptors;
using MiniPlat.Infrastructure.Repositories;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
    {
        services
            .AddAppDbContext(configuration)
            .AddOpenIddictServer(configuration, environment)
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

    private static IServiceCollection AddOpenIddictServer(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
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

                options.AddTokenCredentials(configuration, environment);

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
    
    /// <summary>
    /// Ephemeral keys are regenerated on every start, which invalidates every access and refresh
    /// token that was issued before it - each restart signs all users out for good. So they are
    /// only tolerated in Development, and anything else refuses to start without real certificates.
    /// </summary>
    private static void AddTokenCredentials(this OpenIddictServerBuilder options, IConfiguration configuration,
        IHostEnvironment environment)
    {
        var signing = LoadCertificate(configuration.GetSection("OpenIddict:SigningCertificate"));
        var encryption = LoadCertificate(configuration.GetSection("OpenIddict:EncryptionCertificate"));

        if (signing is not null && encryption is not null)
        {
            options.AddSigningCertificate(signing)
                .AddEncryptionCertificate(encryption);

            return;
        }

        if (signing is not null || encryption is not null)
            throw new InvalidOperationException(
                "OpenIddict needs both a signing and an encryption certificate; only one is configured.");

        if (!environment.IsDevelopment())
            throw new InvalidOperationException(
                "OpenIddict:SigningCertificate and OpenIddict:EncryptionCertificate must be configured " +
                $"in the {environment.EnvironmentName} environment. Without them the server falls back to " +
                "ephemeral keys, and every restart would sign all users out.");

        Console.WriteLine("OpenIddict: no certificates configured, using ephemeral keys. " +
                          "Tokens will not survive a restart.");

        options.AddEphemeralSigningKey()
            .AddEphemeralEncryptionKey();
    }

    private static X509Certificate2? LoadCertificate(IConfigurationSection section)
    {
        var path = section["Path"];

        if (string.IsNullOrWhiteSpace(path))
            return null;

        if (!File.Exists(path))
            throw new FileNotFoundException($"Certificate configured at {section.Path} was not found.", path);

        return X509CertificateLoader.LoadPkcs12FromFile(path, section["Password"]);
    }

    public static IServiceCollection AddInterceptors(this IServiceCollection services)
    {
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        return services;
    }
}