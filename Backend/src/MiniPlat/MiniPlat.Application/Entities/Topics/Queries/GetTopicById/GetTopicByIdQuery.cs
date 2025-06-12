using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Topics.Queries.GetTopicById;

public record GetTopicByIdQuery(TopicId Id) : IQuery<GetTopicByIdResult>
{
    public GetTopicByIdQuery(string Id) : this(TopicId.Of(Guid.Parse(Id))) { }
}

public record GetTopicByIdResult(Topic Topic);

public class GetTopicByIdQueryValidator : AbstractValidator<GetTopicByIdQuery>
{
    public GetTopicByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
