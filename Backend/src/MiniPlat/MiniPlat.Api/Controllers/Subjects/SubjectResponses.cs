using MiniPlat.Domain.ValueObjects;
using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Subjects;

public record CreateSubjectResponse(SubjectId SubjectId);

public record GetSubjectByIdResponse
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
}

public record DeleteSubjectResponse(bool SubjectDeleted);
