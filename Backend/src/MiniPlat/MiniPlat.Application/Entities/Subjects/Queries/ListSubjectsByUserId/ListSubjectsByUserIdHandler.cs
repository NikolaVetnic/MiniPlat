using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;

internal class ListSubjectsByUserIdHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsByUserIdQuery, ListSubjectsByUserIdResult>
{
    public async Task<ListSubjectsByUserIdResult> Handle(ListSubjectsByUserIdQuery query, CancellationToken cancellationToken)
    {
        var pagination = query.PaginationRequest.Normalized();
        var pageIndex = pagination.PageIndex;
        var pageSize = pagination.PageSize;

        var (subjects, totalCount) = await subjectsRepository.ListByUsernameAsync(currentUser.Username ?? throw new
            InvalidOperationException(), pageIndex, pageSize, cancellationToken);

        return new ListSubjectsByUserIdResult(
            new PaginatedResult<Subject>(
                pageIndex,
                pageSize,
                totalCount,
                subjects.Redact(currentUser)));
    }
}
