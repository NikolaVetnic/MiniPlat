using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;

internal class ListSubjectsByUserIdHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsByUserIdQuery, ListSubjectsByUserIdResult>
{
    public async Task<ListSubjectsByUserIdResult> Handle(ListSubjectsByUserIdQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var subjects = await subjectsRepository.ListByUsernameAsync(currentUser.Username ?? throw new
            InvalidOperationException(), pageIndex, pageSize, cancellationToken);

        return new ListSubjectsByUserIdResult(
            new PaginatedResult<Subject>(
                pageIndex,
                pageSize,
                subjects.Count,
                subjects));
    }
}
