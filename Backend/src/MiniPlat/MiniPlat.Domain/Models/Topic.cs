using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Topic : Entity<TopicId>
{
    public required string Title { get; set; } = string.Empty;
    public required string Description { get; set; } = string.Empty;
    public required bool isHidden { get; set; }
    public required string UserId { get; set; } = null!;
    public required SubjectId SubjectId { get; set; }

    public static Topic Create(TopicId id, string title, string description, bool isHidden, string userId, SubjectId subjectId)
    {
        return new Topic
        {
            Id = id,
            Title = title,
            Description = description,
            isHidden = isHidden,
            UserId = userId,
            SubjectId = subjectId
        };
    }
}
