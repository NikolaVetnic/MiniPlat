using Microsoft.AspNetCore.Identity;

namespace MiniPlat.UnitTests.TestSupport;

internal static class TestUserManager
{
    /// <summary>
    /// A UserManager with nothing behind it. Identity has no interface to substitute for, so the
    /// class itself is stood in for; every dependency past the store is optional in its
    /// constructor, and the handlers only ever reach the virtual methods configured per test.
    /// </summary>
    public static UserManager<ApplicationUser> Create() =>
        Substitute.For<UserManager<ApplicationUser>>(
            Substitute.For<IUserStore<ApplicationUser>>(),
            null, null, null, null, null, null, null, null);
}
