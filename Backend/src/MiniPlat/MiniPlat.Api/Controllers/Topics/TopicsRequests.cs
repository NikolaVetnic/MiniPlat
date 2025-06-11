using MiniPlat.Application.Entities.Topics.Commands.CreateTopic;

namespace MiniPlat.Api.Controllers.Topics;

public class CreateTopicRequest
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
}
