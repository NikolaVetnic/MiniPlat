using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Topics.Commands.UpdateTopic;

public record UpdateTopicCommand : ICommand<UpdateTopicResult>
{
    public required TopicId Id { get; init; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public record UpdateTopicResult(Topic Topic);
