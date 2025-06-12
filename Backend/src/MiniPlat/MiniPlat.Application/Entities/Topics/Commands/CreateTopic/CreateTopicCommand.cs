using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Topics.Commands.CreateTopic;

public class CreateTopicCommand : ICommand<CreateTopicResult>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

}

public record CreateTopicResult(TopicId TopicId);

public class CreateTopicCommandValidator : AbstractValidator<CreateTopicCommand>
{
    public CreateTopicCommandValidator()
    {
        // ToDo: Add remaining CreateTopic command validators
    }
}
