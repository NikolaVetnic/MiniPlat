using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.CreateSubject;

public class CreateSubjectCommand : ICommand<CreateSubjectResult>
{
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
    public List<CreateTopicDto> Topics { get; set; } = [];
}

public record CreateSubjectResult(SubjectId SubjectId);

public class CreateSubjectCommandValidator : AbstractValidator<CreateSubjectCommand>
{
    public CreateSubjectCommandValidator()
    {
        // ToDo: Add remaining RegisterUser command validators
    }
}

public class CreateTopicDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsHidden { get; set; }
    public List<CreateMaterialDto> Materials { get; set; } = [];
}

public class CreateMaterialDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public int Order { get; set; }
}
