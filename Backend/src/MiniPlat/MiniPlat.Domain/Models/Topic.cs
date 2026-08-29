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

    /// <summary>
    /// When the topic was marked for deletion, which is when its retention period starts.
    /// Separate from LastModifiedAt because saving the subject recreates every topic row and
    /// would otherwise keep pushing the deadline out.
    /// </summary>
    public DateTime? DeletedAt { get; set; }
}