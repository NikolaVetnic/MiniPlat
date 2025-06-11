using System.Security.Claims;

namespace MiniPlat.Application.Data.Abstractions;

public interface ICurrentUser
{
    ClaimsPrincipal? Principal { get; }
    string? UserId { get; }
    string? Username { get; }
}