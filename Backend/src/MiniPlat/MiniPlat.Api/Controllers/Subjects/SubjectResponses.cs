using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Dtos;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

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

public record ListSubjectsResponse(PaginatedResult<SubjectDto> Subjects);

public record DeleteSubjectResponse(bool SubjectDeleted);
