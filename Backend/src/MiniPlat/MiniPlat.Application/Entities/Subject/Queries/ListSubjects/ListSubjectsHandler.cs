using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;

namespace MiniPlat.Application.Entities.Subject.Queries.ListSubjects;

internal class ListSubjectsHandler(ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsQuery, ListSubjectsResult>
{
    public async Task<ListSubjectsResult> Handle(ListSubjectsQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var subjects = await subjectsRepository.ListSubjectsAsync(pageIndex, pageSize, cancellationToken);

        return new ListSubjectsResult(
            new PaginatedResult<Domain.Models.Subject>(
                pageIndex,
                pageSize,
                subjects.Count,
                subjects));
    }
}
