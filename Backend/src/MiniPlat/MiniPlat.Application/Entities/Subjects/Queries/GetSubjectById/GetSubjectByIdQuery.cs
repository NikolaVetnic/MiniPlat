using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Queries.GetSubjectById;

public record GetSubjectByIdQuery(SubjectId Id) : IQuery<GetSubjectByIdResult>
{
    public GetSubjectByIdQuery(string Id) : this(SubjectId.Of(Guid.Parse(Id))) { }
}

public record GetSubjectByIdResult(Subject Subject);

public class GetSubjectByIdQueryValidator : AbstractValidator<GetSubjectByIdQuery>
{
    public GetSubjectByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
