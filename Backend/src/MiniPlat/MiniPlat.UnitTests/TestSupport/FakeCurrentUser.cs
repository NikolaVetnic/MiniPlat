using System.Security.Claims;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.UnitTests.TestSupport;

/// <summary>
/// A caller, described only by what the application layer asks about them. Hand written rather
/// than substituted because almost every test in here needs one, and the three named factories
/// below say who is calling far more plainly than three stubbed properties would.
/// </summary>
internal sealed class FakeCurrentUser(string? username = null, bool isAdmin = false, string? userId = null)
    : ICurrentUser
{
    public ClaimsPrincipal? Principal => null;
    public string? UserId { get; } = userId;
    public string? Username { get; } = username;
    public bool IsAdmin { get; } = isAdmin;

    /// <summary>Nobody signed in: no username, no roles.</summary>
    public static FakeCurrentUser Anonymous() => new();

    public static FakeCurrentUser Named(string username) => new(username);

    public static FakeCurrentUser Admin(string username = "admin") => new(username, isAdmin: true);
}
