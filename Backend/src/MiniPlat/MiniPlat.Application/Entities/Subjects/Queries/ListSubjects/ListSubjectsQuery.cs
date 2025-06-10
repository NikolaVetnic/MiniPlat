using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;

public record ListSubjectsQuery(PaginationRequest PaginationRequest) : IQuery<ListSubjectsResult>;

public record ListSubjectsResult(PaginatedResult<Subject> Subjects);
