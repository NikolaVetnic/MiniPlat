using System.Net;
using System.Net.Http.Json;

namespace MiniPlat.IntegrationTests.Api;

[Collection(MiniPlatCollection.Name)]
public class AuthEndpointsTests(MiniPlatFixture fixture)
{
    private Task<HttpResponseMessage> Token(Dictionary<string, string> form) =>
        fixture.Client.PostAsync("/api/Auth/Token", new FormUrlEncodedContent(form));

    private static Dictionary<string, string> PasswordGrant(string username, string password) => new()
    {
        ["grant_type"] = "password",
        ["username"] = username,
        ["password"] = password,
        ["scope"] = "openid email profile offline_access api"
    };

    [Fact]
    public async Task A_seeded_lecturer_can_exchange_their_password_for_a_token()
    {
        var response = await Token(PasswordGrant("USRa", "P@ssw0rd!123"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.ReadAs<MiniPlatFixture.TokenResponse>();

        Assert.False(string.IsNullOrWhiteSpace(payload.AccessToken));
        Assert.Equal("Bearer", payload.TokenType);
    }

    /// <summary>
    /// offline_access is what the frontend needs to keep a session alive without asking for the
    /// password again, so the refresh token has to actually come back.
    /// </summary>
    [Fact]
    public async Task Asking_for_offline_access_yields_a_refresh_token()
    {
        var payload = await (await Token(PasswordGrant("USRb", "P@ssw0rd?456"))).ReadAs<MiniPlatFixture.TokenResponse>();

        Assert.False(string.IsNullOrWhiteSpace(payload.RefreshToken));
    }

    [Fact]
    public async Task A_refresh_token_can_be_exchanged_for_a_new_access_token()
    {
        var first = await (await Token(PasswordGrant("USRc", "P@ssw0rd.789"))).ReadAs<MiniPlatFixture.TokenResponse>();

        var response = await Token(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = first.RefreshToken!
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace((await response.ReadAs<MiniPlatFixture.TokenResponse>()).AccessToken));
    }

    [Fact]
    public async Task The_wrong_password_yields_no_token()
    {
        var response = await Token(PasswordGrant("USRa", "not-the-password"));

        Assert.False(response.IsSuccessStatusCode);
        Assert.DoesNotContain("access_token", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_username_nobody_has_yields_no_token()
    {
        var response = await Token(PasswordGrant("nobody", "P@ssw0rd!123"));

        Assert.False(response.IsSuccessStatusCode);
    }

    [Fact]
    public async Task A_grant_the_server_does_not_offer_is_refused()
    {
        var response = await Token(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials"
        });

        Assert.False(response.IsSuccessStatusCode);
    }

    [Fact]
    public async Task User_info_is_closed_to_anyone_without_a_token()
    {
        var response = await fixture.Client.GetAsync("/api/Auth/UserInfo");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task User_info_is_closed_to_a_token_that_is_not_one()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/Auth/UserInfo");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "nonsense");

        var response = await fixture.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>
    /// The frontend fills its profile from this one call, which is why it joins the token's claims
    /// to the lecturer record rather than returning only what the token carries.
    /// </summary>
    [Fact]
    public async Task User_info_returns_the_account_and_the_lecturer_record_behind_it()
    {
        var client = await fixture.ClientFor("USRa", "P@ssw0rd!123");

        var info = await (await client.GetAsync("/api/Auth/UserInfo")).ReadAs<UserInfoWire>();

        Assert.Equal("USRa", info.Username);
        Assert.Equal("USRa@email.com", info.Email);
        Assert.Equal("User", info.FirstName);
        Assert.Equal("Alpha", info.LastName);
        Assert.Equal("dr", info.Title);
        Assert.False(string.IsNullOrWhiteSpace(info.Sub));
    }
}
