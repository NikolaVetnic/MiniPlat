using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Extensions;
using MiniPlat.Domain.Models;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;

namespace MiniPlat.Application.Data;

public class TokenService(UserManager<ApplicationUser> userManager) : ITokenService
{
    public async Task<ClaimsPrincipal?> CreatePasswordGrantPrincipal(string userName, string password)
    {
        // Verify user & password
        var user = await userManager.FindByNameAsync(userName);

        if (user == null || !await userManager.CheckPasswordAsync(user, password))
            return null;

        // Create an OpenIddict identity and add your claims
        var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

        identity.AddClaim(OpenIddictConstants.Claims.Subject, user.Id);
        identity.AddClaim(OpenIddictConstants.Claims.Username, user.UserName ?? "");
        identity.AddClaim(OpenIddictConstants.Claims.Email, user.Email ?? "");
        identity.AddClaim("firstName", user.FirstName ?? "");
        identity.AddClaim("lastName", user.LastName ?? "");

        var principal = new ClaimsPrincipal(identity);

        // Assign scopes & resources
        principal.SetScopes(
            OpenIddictConstants.Scopes.OpenId,
            OpenIddictConstants.Scopes.Email,
            OpenIddictConstants.Scopes.Profile,
            OpenIddictConstants.Scopes.OfflineAccess,
            "api");

        principal.SetResources("resource_server");

        // Map each claim into the AccessToken (and IdentityToken where appropriate)
        principal.MapDefaultDestinations();

        return principal;
    }

    public Task<ClaimsPrincipal?> RefreshTokenPrincipal(ClaimsPrincipal current)
    {
        // SetDestinations can be re-run here if claims should be tweaked - otherwise return existing principal
        return Task.FromResult<ClaimsPrincipal?>(current);
    }
}