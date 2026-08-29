using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Infrastructure;
using MiniPlat.Infrastructure.Extensions;
using MiniPlat.Infrastructure.Interceptors;
using Npgsql;
using Testcontainers.PostgreSql;

namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// One Postgres container for the whole assembly, holding two databases.
///
/// The API runs against a migrated and seeded one, because the seeded catalogue is half of what
/// the endpoint tests are about. The repository tests get an empty one, so a count or an ordering
/// can be asserted outright instead of as a delta against whatever the seeder left behind.
/// </summary>
public sealed class MiniPlatFixture : Xunit.IAsyncLifetime
{
    private const string ApiDatabase = "miniplat_api";
    private const string RepositoryDatabase = "miniplat_repositories";

    /// <summary>A third database, left empty and unmigrated, for the test that seeds one from
    /// nothing the way a first deployment does.</summary>
    private const string VirginDatabase = "miniplat_virgin";

    /// <summary>The password the admin account is seeded with. "none" in the seed file is not one
    /// Identity accepts, so a usable one has to be configured for the seeder to get through.</summary>
    public const string AdminPassword = "T3st-admin!password";

    public const string AdminUsername = "mp_admin";

    /// <summary>The same major version the compose stack runs, so xmin and everything else
    /// behaves here the way it does in the deployed database.</summary>
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17")
        .WithDatabase("postgres")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private readonly Dictionary<string, string> _tokens = [];

    private MiniPlatApiFactory _api = null!;

    public HttpClient Client { get; private set; } = null!;

    public IServiceProvider ApiServices => _api.Services;

    public string RepositoryConnectionString { get; private set; } = null!;

    public string VirginConnectionString { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        await CreateDatabase(ApiDatabase);
        await CreateDatabase(RepositoryDatabase);
        await CreateDatabase(VirginDatabase);

        RepositoryConnectionString = ConnectionStringFor(RepositoryDatabase);
        VirginConnectionString = ConnectionStringFor(VirginDatabase);

        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", ConnectionStringFor(ApiDatabase));
        Environment.SetEnvironmentVariable("Seed__FileName", "initialData.yml");
        Environment.SetEnvironmentVariable("Seed__AdminUsername", AdminUsername);
        Environment.SetEnvironmentVariable("Seed__AdminPassword", AdminPassword);

        // The cleanup loop would otherwise run once at startup against the same database the
        // tests are reading. Its own behaviour is covered directly, on the other database.
        Environment.SetEnvironmentVariable("TopicCleanup__Enabled", "false");

        _api = new MiniPlatApiFactory();
        Client = NewClient();

        // Program.cs migrates and seeds between Build() and Run(), which the test host does reach -
        // but not at a point the tests can wait on. Running it again here is what makes the
        // database ready before the first test, and every step of it is written to be repeatable.
        await _api.Services.MigrateAndSeedDatabaseAsync();

        await using var repositories = NewDbContext();
        await repositories.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        await _api.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    /// <summary>
    /// A DbContext on the empty database, built the way the application builds it - the auditing
    /// interceptor included, since who a change is recorded against is part of what is tested.
    /// </summary>
    public AppDbContext NewDbContext(ICurrentUser? currentUser = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(RepositoryConnectionString)
            .UseOpenIddict()
            .Options;

        return new AppDbContext(options, [new AuditableEntityInterceptor(currentUser ?? new TestCurrentUser())]);
    }

    /// <summary>Empties the tables between repository tests. AspNetUsers is included because a
    /// lecturer row cannot exist without the user it points at. OpenIddict tables are left alone:
    /// nothing on this database issues a token.</summary>
    public async Task ResetRepositoryDatabaseAsync()
    {
        await using var connection = new NpgsqlConnection(RepositoryConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText =
            """TRUNCATE "Subjects", "Topics", "Materials", "Lecturers", "AspNetUsers" CASCADE;""";
        await command.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// A client carrying a password-grant access token for the given seeded account. Tokens are
    /// cached: the token endpoint is rate limited to 30 requests a window, and a suite that asks
    /// for a fresh one per test would start failing on the thirty-first.
    /// </summary>
    public async Task<HttpClient> ClientFor(string username, string password)
    {
        if (!_tokens.TryGetValue(username, out var token))
            _tokens[username] = token = await RequestToken(username, password);

        var client = NewClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    public Task<HttpClient> AdminClient() => ClientFor(AdminUsername, AdminPassword);

    public async Task<string> RequestToken(string username, string password)
    {
        var response = await Client.PostAsync("/api/Auth/Token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["username"] = username,
            ["password"] = password,
            ["scope"] = "openid email profile offline_access api"
        }));

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<TokenResponse>();

        return payload!.AccessToken;
    }

    /// <summary>
    /// Every client speaks https. OpenIddict refuses to issue a token over a plain connection,
    /// and in the deployed stack the request reaches the app as https because nginx says so
    /// through X-Forwarded-Proto - so this is the scheme the token endpoint actually sees.
    /// </summary>
    private HttpClient NewClient() => _api.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost")
    });

    private async Task CreateDatabase(string name)
    {
        var result = await _postgres.ExecScriptAsync($"""CREATE DATABASE "{name}";""");

        if (result.ExitCode != 0)
            throw new InvalidOperationException($"Could not create database {name}: {result.Stderr}");
    }

    private string ConnectionStringFor(string database) =>
        new NpgsqlConnectionStringBuilder(_postgres.GetConnectionString())
        {
            Database = database,
            IncludeErrorDetail = true
        }.ConnectionString;

    public sealed record TokenResponse(
        [property: System.Text.Json.Serialization.JsonPropertyName("access_token")] string AccessToken,
        [property: System.Text.Json.Serialization.JsonPropertyName("refresh_token")] string? RefreshToken,
        [property: System.Text.Json.Serialization.JsonPropertyName("token_type")] string TokenType);
}

/// <summary>
/// Every test class joins this one collection, so they share the container and run one after
/// another. Sharing a database and running in parallel would be a different suite entirely.
/// </summary>
[CollectionDefinition(Name)]
public sealed class MiniPlatCollection : ICollectionFixture<MiniPlatFixture>
{
    public const string Name = "MiniPlat";
}
