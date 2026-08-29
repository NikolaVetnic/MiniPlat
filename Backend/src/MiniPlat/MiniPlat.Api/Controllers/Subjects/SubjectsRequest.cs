using MiniPlat.Application.Entities.Subjects.Commands.CreateSubject;
using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Subjects;

public class CreateSubjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Semester { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
}

/// <summary>
/// A partial update: every field is optional, and one left out of the body is left as it is on
/// the subject. Nothing carries a default, because a default arrives at the handler looking
/// exactly like a value the caller meant to send.
/// </summary>
public class UpdateSubjectRequest
{
    public string? Title { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Level? Level { get; set; }
    public int? Semester { get; set; }
    public string? Lecturer { get; set; }
    public string? Assistant { get; set; }

    /// <summary>Omit to leave the topics alone; send an empty list to remove them all.</summary>
    public List<Topic>? Topics { get; set; }

    /// <summary>Version the client last read; omit to skip the conflict check.</summary>
    public uint Version { get; set; }
}

public class ReorderTopicsRequest
{
    /// <summary>Topic ids in their new display order.</summary>
    public List<Guid> TopicIds { get; set; } = [];
}

public class UpdateTopicStateRequest
{
    /// <summary>Omit a flag to leave it as it is.</summary>
    public bool? IsHidden { get; set; }
    public bool? IsDeleted { get; set; }
}

public class SetSubjectStaffRequest
{
    public string Lecturer { get; set; } = string.Empty;

    /// <summary>Null or empty removes the assistant.</summary>
    public string? Assistant { get; set; }
}

public static class SubjectRequestExtensions
{
    public static CreateSubjectCommand ToCommand(this CreateSubjectRequest request)
    {
        return new CreateSubjectCommand
        {
            Title = request.Title,
            Code = request.Code,
            Description = request.Description,
            Level = request.Level,
            Semester = request.Semester,
            Lecturer = request.Lecturer,
            Assistant = request.Assistant
        };
    }
}