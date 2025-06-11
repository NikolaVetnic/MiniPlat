using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Topic : Entity<TopicId>
{
    public required string Title { get; set; } = string.Empty;
    public required string Description { get; set; } = string.Empty;
    public bool isHidden { get; set; }
    public string UserId { get; set; } = null!;
    public required SubjectId SubjectId { get; set; }

    public static Topic Create(TopicId id, string title, string description, string userId, SubjectId subjectId)
    {
        return new Topic
        {
            Id = id,
            Title = title,
            Description = description,
            UserId = userId,
            SubjectId = subjectId
        };
    }
}
