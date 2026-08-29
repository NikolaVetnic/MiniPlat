using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MiniPlat.Application.Data;
using OpenIddict.Abstractions;

namespace MiniPlat.UnitTests.Application.Data;

public class CurrentUserTests
{
    private static CurrentUser From(params Claim[] claims)
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"))
        });

        return new CurrentUser(accessor);
    }

    private static CurrentUser WithoutARequest()
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns((HttpContext?)null);

        return new CurrentUser(accessor);
    }

    [Fact]
    public void Outside_a_request_there_is_nobody_and_nothing_throws()
    {
        var user = WithoutARequest();

        Assert.Null(user.Principal);
        Assert.Null(user.UserId);
        Assert.Null(user.Username);
        Assert.False(user.IsAdmin);
    }

    [Fact]
    public void An_anonymous_request_carries_no_username_and_no_roles()
    {
        var user = From();

        Assert.Null(user.UserId);
        Assert.Null(user.Username);
        Assert.False(user.IsAdmin);
    }

    [Fact]
    public void The_subject_claim_is_the_user_id()
    {
        var user = From(new Claim(OpenIddictConstants.Claims.Subject, "user-1"));

        Assert.Equal("user-1", user.UserId);
    }

    /// <summary>
    /// Tokens issued here carry "sub", but a principal rebuilt by ASP.NET Identity names the same
    /// thing NameIdentifier, so both are accepted.
    /// </summary>
    [Fact]
    public void A_name_identifier_stands_in_when_there_is_no_subject_claim()
    {
        var user = From(new Claim(ClaimTypes.NameIdentifier, "user-1"));

        Assert.Equal("user-1", user.UserId);
    }

    [Fact]
    public void The_subject_claim_wins_when_both_are_present()
    {
        var user = From(
            new Claim(ClaimTypes.NameIdentifier, "identity-1"),
            new Claim(OpenIddictConstants.Claims.Subject, "openiddict-1"));

        Assert.Equal("openiddict-1", user.UserId);
    }

    [Fact]
    public void The_username_claim_is_the_username()
    {
        var user = From(new Claim(OpenIddictConstants.Claims.Username, "ana"));

        Assert.Equal("ana", user.Username);
    }

    /// <summary>
    /// The reader looks the claim up by a bare string while the token writes it through the
    /// OpenIddict constant. Every ownership check in the application layer turns on the two
    /// agreeing, and nothing else in the build would notice if they stopped.
    /// </summary>
    [Fact]
    public void The_username_claim_the_reader_looks_for_is_the_one_the_token_writes()
    {
        Assert.Equal("username", OpenIddictConstants.Claims.Username);
    }

    [Fact]
    public void The_admin_role_makes_an_administrator()
    {
        var user = From(new Claim(OpenIddictConstants.Claims.Role, Roles.Admin));

        Assert.True(user.IsAdmin);
    }

    [Fact]
    public void An_administrator_is_recognised_among_several_roles()
    {
        var user = From(
            new Claim(OpenIddictConstants.Claims.Role, "Lecturer"),
            new Claim(OpenIddictConstants.Claims.Role, Roles.Admin));

        Assert.True(user.IsAdmin);
    }

    [Fact]
    public void Another_role_does_not()
    {
        var user = From(new Claim(OpenIddictConstants.Claims.Role, "Lecturer"));

        Assert.False(user.IsAdmin);
    }

    /// <summary>
    /// The role check is by value, so a role that merely looks like the admin one is not it.
    /// </summary>
    [Theory]
    [InlineData("admin")]
    [InlineData("ADMIN")]
    [InlineData("Administrator")]
    public void A_role_that_only_resembles_the_admin_one_does_not_count(string role)
    {
        Assert.False(From(new Claim(OpenIddictConstants.Claims.Role, role)).IsAdmin);
    }

    /// <summary>
    /// The role claim is read by its OpenIddict type rather than through RequireRole, so a
    /// principal whose roles arrive under the ClaimTypes name is not an administrator here.
    /// This is why the Admin policy checks the same claim type directly.
    /// </summary>
    [Fact]
    public void A_role_under_the_dotnet_claim_type_is_not_the_one_that_is_checked()
    {
        Assert.False(From(new Claim(ClaimTypes.Role, Roles.Admin)).IsAdmin);
    }

    /// <summary>
    /// The principal is captured when the object is built, which is safe only because it is
    /// registered per request. A wider lifetime would pin one caller's identity onto everyone.
    /// </summary>
    [Fact]
    public void The_caller_is_captured_once_when_the_object_is_built()
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(OpenIddictConstants.Claims.Username, "ana")],
                "test"))
        });

        var user = new CurrentUser(accessor);

        accessor.HttpContext.Returns(new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(OpenIddictConstants.Claims.Username, "bob")],
                "test"))
        });

        Assert.Equal("ana", user.Username);
    }
}
