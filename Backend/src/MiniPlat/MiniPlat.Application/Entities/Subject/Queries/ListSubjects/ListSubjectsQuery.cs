using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;

namespace MiniPlat.Application.Entities.Subject.Queries.ListSubjects;

public record ListSubjectsQuery(PaginationRequest PaginationRequest) : IQuery<ListSubjectsResult>;

public record ListSubjectsResult(PaginatedResult<Domain.Models.Subject> Subjects);
