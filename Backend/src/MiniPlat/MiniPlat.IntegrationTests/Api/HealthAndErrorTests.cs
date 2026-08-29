using System.Net;

namespace MiniPlat.IntegrationTests.Api;

public class HealthAndErrorTests(MiniPlatFixture fixture) : ApiTestBase(fixture)
{
    /// <summary>
    /// Compose waits on this before starting anything that depends on the API, and it checks the
    /// database rather than only that the process is up.
    /// </summary>
    [Fact]
    public async Task The_health_endpoint_reports_healthy_when_the_database_is_reachable()
    {
        var response = await Anonymous.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task The_health_endpoint_is_open_and_not_rate_limited()
    {
        foreach (var _ in Enumerable.Range(0, 5))
            Assert.Equal(HttpStatusCode.OK, (await Anonymous.GetAsync("/health")).StatusCode);
    }

    /// <summary>
    /// Everything that goes wrong comes back as a problem document, so the frontend has one shape
    /// to read an error out of whatever the endpoint was.
    /// </summary>
    [Fact]
    public async Task A_failure_is_reported_as_a_problem_document()
    {
        var response = await Anonymous.GetAsync($"/api/Subjects/{Guid.NewGuid()}");
        var problem = await response.ReadProblem();

        Assert.Equal("SubjectNotFoundException", problem.Title);
        Assert.Equal(404, problem.Status);
        Assert.Contains("/api/Subjects/", problem.Instance);
        Assert.False(string.IsNullOrWhiteSpace(problem.Detail));
    }

    [Fact]
    public async Task A_problem_document_carries_a_trace_id()
    {
        var body = await (await Anonymous.GetAsync($"/api/Subjects/{Guid.NewGuid()}")).Content.ReadAsStringAsync();

        Assert.Contains("traceId", body);
    }

    [Fact]
    public async Task A_route_nobody_serves_is_a_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Anonymous.GetAsync("/api/NoSuchThing")).StatusCode);
    }

    /// <summary>
    /// The frontend is served from another origin, so the browser will not read a response the
    /// API does not say it may.
    /// </summary>
    [Fact]
    public async Task The_configured_frontend_origin_is_allowed_to_read_the_catalogue()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/Subjects");
        request.Headers.Add("Origin", "http://localhost:4010");

        var response = await Anonymous.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task An_origin_nobody_configured_is_not()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/Subjects");
        request.Headers.Add("Origin", "https://not-the-frontend.test");

        var response = await Anonymous.SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
