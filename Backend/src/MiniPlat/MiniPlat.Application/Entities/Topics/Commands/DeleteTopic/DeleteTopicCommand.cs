using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Topics.Commands.DeleteTopic;

public record DeleteTopicCommand(TopicId Id) : ICommand<DeleteTopicResult>
{
    public DeleteTopicCommand(string Id) : this(TopicId.Of(Guid.Parse(Id))) { }
}

public record DeleteTopicResult(bool IsTopicDeleted);

public class DeleteTopicCommandValidator : AbstractValidator<DeleteTopicCommand>
{
    public DeleteTopicCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
