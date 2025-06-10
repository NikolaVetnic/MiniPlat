using MiniPlat.Api.Extensions;
using MiniPlat.Application.Extensions;
using MiniPlat.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services
    .AddApiServices(builder.Configuration)
    .AddApplicationServices()
    .AddInfrastructureServices(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException());

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.Services.MigrateAndSeedDatabaseAsync();

app.UseExceptionHandler(_ => { }); // ToDo: To be removed as it eats up any exceptions on startup

app.MapHealthChecks("/health");

app.Run();