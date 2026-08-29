using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// The real API, wired to a throwaway database.
///
/// Everything it needs is handed over as environment variables rather than through
/// ConfigureAppConfiguration, because Program.cs reads configuration while it is still building
/// the host: it passes the connection string straight to the health check, and adds
/// AddEnvironmentVariables() last so those win over every appsettings file. That also keeps a
/// developer's own gitignored appsettings.override.json from changing what the tests see.
/// </summary>
internal sealed class MiniPlatApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.UseEnvironment("Development");
}
