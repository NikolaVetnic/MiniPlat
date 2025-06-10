using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subject.Commands.CreateSubject;

public class CreateSubjectCommand : ICommand<CreateSubjectResult>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
}

public record CreateSubjectResult(Guid SubjectId);

public class CreateSubjectCommandValidator : AbstractValidator<CreateSubjectCommand>
{
    public CreateSubjectCommandValidator()
    {
        // ToDo: Add remaining RegisterUser command validators
    }
}
