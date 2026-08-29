using Microsoft.AspNetCore.Authorization;
using MiniPlat.Domain.Models;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Api.Authorization;

public static class AuthorizationPolicies
{
    public const string Admin = "Admin";

    public static AuthorizationOptions AddMiniPlatPolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(Admin, policy =>
        {
            policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
            policy.RequireAuthenticatedUser();

            // Checks the "role" claim directly rather than going through RequireRole, which
            // depends on ClaimsIdentity.RoleClaimType lining up with what OpenIddict issues.
            policy.RequireClaim(OpenIddictConstants.Claims.Role, Roles.Admin);
        });

        return options;
    }
}
