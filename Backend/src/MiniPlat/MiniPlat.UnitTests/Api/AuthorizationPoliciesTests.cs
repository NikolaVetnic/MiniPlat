using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Api.Authorization;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.UnitTests.Api;

public class AuthorizationPoliciesTests
{
    private static readonly IServiceProvider Services = new ServiceCollection()
        .AddLogging()
        .AddAuthorization(options => options.AddMiniPlatPolicies())
        .BuildServiceProvider();

    private static readonly AuthorizationPolicy Policy =
        new AuthorizationOptions().AddMiniPlatPolicies().GetPolicy(AuthorizationPolicies.Admin)!;

    private static Task<AuthorizationResult> Evaluate(ClaimsPrincipal principal) =>
        Services.GetRequiredService<IAuthorizationService>()
            .AuthorizeAsync(principal, null, AuthorizationPolicies.Admin);

    private static Task<AuthorizationResult> EvaluateSignedIn(params Claim[] claims) =>
        Evaluate(new ClaimsPrincipal(new ClaimsIdentity(claims, "test")));

    [Fact]
    public void The_policy_is_bound_to_the_scheme_that_validates_the_tokens()
    {
        Assert.Equal([OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme], Policy.AuthenticationSchemes);
    }

    [Fact]
    public async Task An_administrator_satisfies_the_policy()
    {
        Assert.True((await EvaluateSignedIn(new Claim(OpenIddictConstants.Claims.Role, Roles.Admin))).Succeeded);
    }

    [Fact]
    public async Task A_signed_in_caller_without_the_role_does_not()
    {
        Assert.False((await EvaluateSignedIn(new Claim(OpenIddictConstants.Claims.Role, "Lecturer"))).Succeeded);
    }

    [Fact]
    public async Task A_signed_in_caller_with_no_roles_at_all_does_not()
    {
        Assert.False((await EvaluateSignedIn(new Claim(OpenIddictConstants.Claims.Username, "ana"))).Succeeded);
    }

    [Fact]
    public async Task An_anonymous_caller_does_not()
    {
        Assert.False((await Evaluate(new ClaimsPrincipal(new ClaimsIdentity()))).Succeeded);
    }

    /// <summary>
    /// The role is checked as a claim rather than through RequireRole, which would depend on the
    /// identity's RoleClaimType lining up with what OpenIddict issues. A role arriving under the
    /// .NET claim type is deliberately not enough.
    /// </summary>
    [Fact]
    public async Task A_role_under_the_dotnet_claim_type_does_not_satisfy_the_policy()
    {
        Assert.False((await EvaluateSignedIn(new Claim(ClaimTypes.Role, Roles.Admin))).Succeeded);
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("Administrator")]
    public async Task A_role_that_only_resembles_the_admin_one_does_not_satisfy_the_policy(string role)
    {
        Assert.False((await EvaluateSignedIn(new Claim(OpenIddictConstants.Claims.Role, role))).Succeeded);
    }

    /// <summary>
    /// The same spelling the seeder and the token issuer use, which is the whole reason the role
    /// name lives in the domain rather than in three string literals.
    /// </summary>
    [Fact]
    public void The_policy_name_and_the_role_it_requires_are_the_same_admin()
    {
        Assert.Equal(Roles.Admin, AuthorizationPolicies.Admin);
    }
}
