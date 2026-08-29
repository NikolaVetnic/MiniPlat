using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using IPNetwork = Microsoft.AspNetCore.HttpOverrides.IPNetwork;
using MiniPlat.Api.Extensions;
using MiniPlat.Application.Exceptions.Handlers;
using MiniPlat.Application.Extensions;
using MiniPlat.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Clear and reconfigure configuration sources if needed
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddJsonFile("appsettings.override.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddControllers();

builder.Services
    .AddApiServices(builder.Configuration)
    .AddApplicationServices()
    .AddInfrastructureServices(builder.Configuration, builder.Environment);

builder.Services.AddInterceptors();

builder.Services.AddExceptionHandler<CustomExceptionHandler>();

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException());

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        if (allowedOrigins != null)
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
    });
});

// Bind forwarded headers options from configuration
var forwardedHeadersSection = builder.Configuration.GetSection("ForwardedHeaders");
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};

forwardedHeadersSection.Bind(forwardedHeadersOptions);

// Bind() cannot turn the configured strings into IPAddress/IPNetwork, so both lists are parsed
// by hand. KnownNetworks carries the reverse proxy: pinning a single container address breaks
// the moment Docker hands out a different one, and X-Forwarded-For is then silently ignored -
// which would put every client into the same rate limit partition, keyed on the proxy.
foreach (var proxy in forwardedHeadersSection.GetSection("KnownProxies").Get<string[]>() ?? [])
    forwardedHeadersOptions.KnownProxies.Add(IPAddress.Parse(proxy));

foreach (var cidr in forwardedHeadersSection.GetSection("KnownNetworks").Get<string[]>() ?? [])
{
    var parts = cidr.Split('/', 2);

    if (parts.Length != 2)
        throw new InvalidOperationException($"ForwardedHeaders:KnownNetworks entry '{cidr}' is not CIDR notation.");

    forwardedHeadersOptions.KnownNetworks.Add(
        new IPNetwork(IPAddress.Parse(parts[0]), int.Parse(parts[1])));
}

var app = builder.Build();

app.UseForwardedHeaders(forwardedHeadersOptions);

app.Logger.LogInformation(
    "Forwarded headers trusted from networks [{Networks}] and proxies [{Proxies}]. " +
    "Client addresses outside these are taken from the connection, not X-Forwarded-For.",
    string.Join(", ", forwardedHeadersOptions.KnownNetworks.Select(n => $"{n.Prefix}/{n.PrefixLength}")),
    string.Join(", ", forwardedHeadersOptions.KnownProxies));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseRouting();

app.UseRateLimiter();

app.UseCors("AllowSpecificOrigins");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.Services.MigrateAndSeedDatabaseAsync();

app.UseExceptionHandler(_ => { }); // ToDo: To be removed as it eats up any exceptions on startup

app.MapHealthChecks("/health").DisableRateLimiting();

app.Run();