using MediatR;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;

// ReSharper disable InvertIf

namespace MiniPlat.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ISender sender, ITokenService tokenService)
    : ControllerBase
{
    [HttpPost("Token")]
    public async Task<IActionResult> Exchange()
    {
        var request = HttpContext.GetOpenIddictServerRequest()!;

        if (request.IsPasswordGrantType())
        {
            var principal = await tokenService.CreatePasswordGrantPrincipal(request.Username!, request.Password!);

            if (principal is null)
                return Forbid();

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        if (request.IsRefreshTokenGrantType())
        {
            var current = (await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme))
                .Principal!;
            var principal = await tokenService.RefreshTokenPrincipal(current);

            if (principal is null)
                return Forbid();

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        return BadRequest("Unsupported grant type.");
    }

    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    [HttpGet("UserInfo"), Produces("application/json")]
    public async Task<IActionResult> UserInfo()
    {
        var principal = HttpContext.User;

        var username = principal.GetClaim(OpenIddictConstants.Claims.Username);

        var query = new GetLecturerByUsernameQuery(username ?? throw new InvalidOperationException());
        var result = await sender.Send(query);
        var lecturer = result.Lecturer;

        return Ok(new
        {
            sub = principal.GetClaim(OpenIddictConstants.Claims.Subject),
            username = principal.GetClaim(OpenIddictConstants.Claims.Username),
            email = principal.GetClaim(OpenIddictConstants.Claims.Email),
            
            firstName = principal.GetClaim("firstName"),
            lastName = principal.GetClaim("lastName"),
            title = lecturer.Title,
            department = lecturer.Department
        });
    }
}