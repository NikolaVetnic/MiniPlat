using System.Net.Http.Json;
using System.Text.Json;

namespace MiniPlat.IntegrationTests.Infrastructure;

public static class HttpExtensions
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Reads the body into the shape the frontend expects. A missing or renamed field fails the
    /// assertion that follows rather than silently arriving as null.
    /// </summary>
    public static async Task<T> ReadAs<T>(this HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.IsSuccessStatusCode,
            $"Expected a successful response, got {(int)response.StatusCode}: {body}");

        return JsonSerializer.Deserialize<T>(body, Options)
               ?? throw new InvalidOperationException($"The body did not deserialise into {typeof(T).Name}: {body}");
    }

    public static async Task<ProblemWire> ReadProblem(this HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<ProblemWire>(body, Options)
               ?? throw new InvalidOperationException($"The body was not a problem document: {body}");
    }

    public static Task<HttpResponseMessage> PutJson<T>(this HttpClient client, string url, T value) =>
        client.PutAsJsonAsync(url, value, Options);

    public static Task<HttpResponseMessage> PostJson<T>(this HttpClient client, string url, T value) =>
        client.PostAsJsonAsync(url, value, Options);

    public static Task<HttpResponseMessage> PatchJson<T>(this HttpClient client, string url, T value) =>
        client.PatchAsJsonAsync(url, value, Options);
}
