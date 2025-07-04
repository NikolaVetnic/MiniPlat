using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MiniPlat.Application.Data.Abstractions;
using OpenIddict.Abstractions;

namespace MiniPlat.Application.Data;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public ClaimsPrincipal? Principal { get; } = httpContextAccessor.HttpContext?.User;

    public string? UserId =>
        Principal?.FindFirst(OpenIddictConstants.Claims.Subject)?.Value ??
        Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public string? Username => Principal?.FindFirst("username")?.Value;
}