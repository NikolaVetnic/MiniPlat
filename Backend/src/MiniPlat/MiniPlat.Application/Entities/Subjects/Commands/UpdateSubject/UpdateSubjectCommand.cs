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
    public int? Semester { get; set; }
    public int? Order { get; set; }
    public string? Lecturer { get; set; } = string.Empty;
    public string? Assistant { get; set; }
    public List<Topic>? Topics { get; set; } = [];

    /// <summary>
    /// The version the caller last read. Zero means the caller did not supply one, and the save
    /// proceeds without a conflict check - kept so existing callers are not broken by this.
    /// </summary>
    public uint Version { get; set; }
}

public record UpdateSubjectResult(Subject Subject);