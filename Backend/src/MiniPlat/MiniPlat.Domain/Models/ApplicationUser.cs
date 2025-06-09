using Microsoft.AspNetCore.Identity;

namespace MiniPlat.Domain.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
}