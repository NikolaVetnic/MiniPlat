using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using OpenIddict.Abstractions;

namespace MiniPlat.Application.Data;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public ClaimsPrincipal? Principal { get; } = httpContextAccessor.HttpContext?.User;

    public string? UserId =>
        Principal?.FindFirst(OpenIddictConstants.Claims.Subject)?.Value ??
        Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public string? Username => Principal?.FindFirst("username")?.Value;

    public bool IsAdmin => Principal?
        .FindAll(OpenIddictConstants.Claims.Role)
        .Any(c => c.Value == Roles.Admin) ?? false;
}