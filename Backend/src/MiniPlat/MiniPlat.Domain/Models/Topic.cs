using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Topic : Entity<TopicId>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool isHidden { get; set; }
    public string UserId { get; set; } = null!;
}
