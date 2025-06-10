using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Lecturer : Entity<LecturerId>
{
    public string? Title { get; set; }
    public string? Department { get; set; }

    public string UserId { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}