using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Topic : Entity<TopicId>
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int Order { get; set; }
    public List<Material> Materials { get; set; } = [];
    public bool IsHidden { get; set; } = false;
}