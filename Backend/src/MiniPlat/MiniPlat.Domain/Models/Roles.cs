namespace MiniPlat.Domain.Models;

/// <summary>
/// Identity role names. Kept in the domain so seeding, token issuance and
/// authorization policies all agree on the spelling.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
}
