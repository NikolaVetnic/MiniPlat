using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;

public record DeleteSubjectCommand(SubjectId Id) : ICommand<DeleteSubjectResult>;

public record DeleteSubjectResult(bool IsSubjectDeleted);

public class DeleteSubjectCommandValidator : AbstractValidator<DeleteSubjectCommand>
{
    public DeleteSubjectCommandValidator()
    {
        RuleFor(command => command.Id).NotNull();
    }
}
