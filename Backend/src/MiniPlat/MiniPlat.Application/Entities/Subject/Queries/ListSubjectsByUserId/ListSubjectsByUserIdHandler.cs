using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;

namespace MiniPlat.Application.Entities.Subject.Queries.ListSubjectsByUserId;

internal class ListSubjectsByUserIdHandler(ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsByUserIdQuery, ListSubjectsByUserIdResult>
{
    public async Task<ListSubjectsByUserIdResult> Handle(ListSubjectsByUserIdQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var subjects = await subjectsRepository.ListSubjectsByUserIdAsync(query.UserId, pageIndex, pageSize, cancellationToken);

        return new ListSubjectsByUserIdResult(
            new PaginatedResult<Domain.Models.Subject>(
                pageIndex,
                pageSize,
                subjects.Count,
                subjects));
    }
}
