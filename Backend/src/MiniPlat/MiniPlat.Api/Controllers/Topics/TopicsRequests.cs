using MiniPlat.Application.Entities.Topics.Commands.CreateTopic;
using MiniPlat.Application.Entities.Topics.Commands.UpdateTopic;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Topics;

public class CreateTopicRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateTopicRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public static class TopicRequestExtensions
{
    public static CreateTopicCommand ToCommand(this CreateTopicRequest request)
    {
        return new CreateTopicCommand
        {
            Title = request.Title,
            Description = request.Description
        };
    }

    public static UpdateTopicCommand ToCommand(this UpdateTopicRequest request, string topicId)
    {
        return new UpdateTopicCommand
        {
            Id = TopicId.Of(Guid.Parse(topicId)),
            Title = request.Title,
            Description = request.Description
        };
    }
}
