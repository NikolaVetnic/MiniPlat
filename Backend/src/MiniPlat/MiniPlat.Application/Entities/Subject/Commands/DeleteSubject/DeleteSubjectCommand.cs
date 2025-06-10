using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subject.Commands.DeleteSubject;

public record DeleteSubjectCommand(SubjectId Id) : ICommand<DeleteSubjectResult>
{
    public DeleteSubjectCommand(string Id) : this(SubjectId.Of(Guid.Parse(Id))) { }
}

public record DeleteSubjectResult(bool SubjectDeleted);

public class DeleteSubjectCommandValidator : AbstractValidator<DeleteSubjectCommand>
{
    public DeleteSubjectCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
