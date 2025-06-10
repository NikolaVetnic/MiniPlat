using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;

namespace MiniPlat.Application.Entities.Subject.Queries.ListSubjectsByUserId;

public record ListSubjectsByUserIdQuery(string UserId, PaginationRequest PaginationRequest) : IQuery<ListSubjectsByUserIdResult>;

public record ListSubjectsByUserIdResult(PaginatedResult<Domain.Models.Subject> Subjects);
