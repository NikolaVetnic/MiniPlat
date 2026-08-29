using System.Security.Claims;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// Stands in for the signed-in caller when a DbContext is built outside a request, which is what
/// the auditing interceptor asks for.
/// </summary>
internal sealed class TestCurrentUser(string? username = null, bool isAdmin = false) : ICurrentUser
{
    public ClaimsPrincipal? Principal => null;
    public string? UserId => null;
    public string? Username { get; } = username;
    public bool IsAdmin { get; } = isAdmin;
}
