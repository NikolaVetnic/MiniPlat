using System.Security.Claims;

namespace MiniPlat.Application.Data.Abstractions;

public interface ITokenService
{
    Task<ClaimsPrincipal?> CreatePasswordGrantPrincipal(string userName, string password);
    Task<ClaimsPrincipal?> RefreshTokenPrincipal(ClaimsPrincipal current);
}