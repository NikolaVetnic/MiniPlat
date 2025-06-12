using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Topic : Entity<TopicId>
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public List<Material> Materials { get; set; } = [];
    public bool IsHidden { get; set; } = false;

    public static Topic Create(TopicId id, string title, string description)
    {
        var topic = new Topic
        {
            Id = id,
            Title = title,
            Description = description
        };
        return topic;
    }
}
