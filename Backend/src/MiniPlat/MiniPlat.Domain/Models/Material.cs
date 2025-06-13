using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Material : Entity<MaterialId>
{
    public required string Description { get; set; }
    public required string Link { get; set; }
    public int Order { get; set; }
}