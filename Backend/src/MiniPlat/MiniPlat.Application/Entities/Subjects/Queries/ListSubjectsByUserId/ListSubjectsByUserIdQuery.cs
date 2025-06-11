using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;

public record ListSubjectsByUserIdQuery(PaginationRequest PaginationRequest) : IQuery<ListSubjectsByUserIdResult>;

public record ListSubjectsByUserIdResult(PaginatedResult<Subject> Subjects);
