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
    .AddInfrastructureServices(builder.Configuration);

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.UseCors("AllowSpecificOrigins");
app.MapControllers();

await app.Services.MigrateAndSeedDatabaseAsync();

app.UseExceptionHandler(_ => { }); // ToDo: To be removed as it eats up any exceptions on startup

app.MapHealthChecks("/health");

app.Run();