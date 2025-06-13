using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

public class UpdateSubjectCommand : ICommand<UpdateSubjectResult>
{
    public required SubjectId Id { get; set; }
    public string? Title { get; set; } = string.Empty;
    public string? Code { get; set; } = string.Empty;
    public string? Description { get; set; } = string.Empty;
    public Level? Level { get; set; }
    public int? Year { get; set; }
    public string? Lecturer { get; set; } = string.Empty;
    public string? Assistant { get; set; } = string.Empty;
    public List<Topic>? Topics { get; set; } = [];
}

public record UpdateSubjectResult(Subject Subject);