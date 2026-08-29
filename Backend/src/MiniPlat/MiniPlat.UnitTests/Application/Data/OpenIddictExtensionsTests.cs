using System.Security.Claims;
using MiniPlat.Application.Extensions;
using OpenIddict.Abstractions;

namespace MiniPlat.UnitTests.Application.Data;

public class OpenIddictDestinationTests
{
    private const string AccessToken = OpenIddictConstants.Destinations.AccessToken;
    private const string IdentityToken = OpenIddictConstants.Destinations.IdentityToken;

    private static ClaimsPrincipal PrincipalWith(IEnumerable<string> scopes, params Claim[] claims)
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
        principal.SetScopes(scopes);
        principal.MapDefaultDestinations();

        return principal;
    }

    private static string[] DestinationsOf(ClaimsPrincipal principal, string claimType) =>
        principal.FindFirst(claimType)!.GetDestinations().ToArray();

    [Fact]
    public void The_subject_goes_into_both_tokens_whatever_was_granted()
    {
        var principal = PrincipalWith([], new Claim(OpenIddictConstants.Claims.Subject, "user-1"));

        Assert.Equal([AccessToken, IdentityToken], DestinationsOf(principal, OpenIddictConstants.Claims.Subject));
    }

    [Fact]
    public void The_username_goes_into_both_tokens_when_the_profile_scope_was_granted()
    {
        var principal = PrincipalWith(
            [OpenIddictConstants.Scopes.Profile], new Claim(OpenIddictConstants.Claims.Username, "ana"));

        Assert.Equal([AccessToken, IdentityToken], DestinationsOf(principal, OpenIddictConstants.Claims.Username));
    }

    [Fact]
    public void Without_the_profile_scope_the_username_stays_out_of_the_identity_token()
    {
        var principal = PrincipalWith([], new Claim(OpenIddictConstants.Claims.Username, "ana"));

        Assert.Equal([AccessToken], DestinationsOf(principal, OpenIddictConstants.Claims.Username));
    }

    [Fact]
    public void The_email_stays_out_of_the_identity_token_even_with_the_email_scope()
    {
        var principal = PrincipalWith(
            [OpenIddictConstants.Scopes.Email], new Claim(OpenIddictConstants.Claims.Email, "ana@example.test"));

        Assert.Equal([AccessToken], DestinationsOf(principal, OpenIddictConstants.Claims.Email));
    }

    [Theory]
    [InlineData("firstName")]
    [InlineData("lastName")]
    public void The_display_name_claims_ride_along_in_the_access_token(string claimType)
    {
        var principal = PrincipalWith([OpenIddictConstants.Scopes.Profile], new Claim(claimType, "Ana"));

        Assert.Equal([AccessToken], DestinationsOf(principal, claimType));
    }

    /// <summary>
    /// The fallback is the access token and never the identity token, so a claim added later
    /// cannot leak into the id_token by being forgotten here.
    /// </summary>
    [Fact]
    public void A_claim_nobody_wrote_a_rule_for_goes_only_into_the_access_token()
    {
        var principal = PrincipalWith(
            [OpenIddictConstants.Scopes.Profile], new Claim("department", "Informatics"));

        Assert.Equal([AccessToken], DestinationsOf(principal, "department"));
    }

    [Fact]
    public void Every_claim_on_the_principal_is_given_a_destination()
    {
        var principal = PrincipalWith(
            [OpenIddictConstants.Scopes.Profile, OpenIddictConstants.Scopes.Email],
            new Claim(OpenIddictConstants.Claims.Subject, "user-1"),
            new Claim(OpenIddictConstants.Claims.Username, "ana"),
            new Claim(OpenIddictConstants.Claims.Email, "ana@example.test"),
            new Claim(OpenIddictConstants.Claims.Role, Roles.Admin));

        Assert.All(principal.Claims, claim => Assert.NotEmpty(claim.GetDestinations()));
    }
}
