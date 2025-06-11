using MiniPlat.Application.Entities.Topics.Commands.CreateTopic;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Topics;

public class CreateTopicRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public SubjectId SubjectId { get; set; }
}

public static class TopicsRequestExtensions
{
    public static CreateTopicCommand ToCommand(this CreateTopicRequest request)
    {
        return new CreateTopicCommand
        {
            Title = request.Title,
            Description = request.Description,
            SubjectId = request.SubjectId
        };
    }
}