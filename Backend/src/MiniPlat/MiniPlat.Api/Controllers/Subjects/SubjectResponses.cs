using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Dtos;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Subjects;

public record CreateSubjectResponse(SubjectId SubjectId);

public record GetSubjectByIdResponse(Subject Subject);

public record ListSubjectsResponse(PaginatedResult<Subject> Subjects);

public record DeleteSubjectResponse(bool IsSubjectDeleted);
