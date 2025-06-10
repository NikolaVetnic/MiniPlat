using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;

internal class ListSubjectsHandler(ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsQuery, ListSubjectsResult>
{
    public async Task<ListSubjectsResult> Handle(ListSubjectsQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var subjects = await subjectsRepository.ListAsync(pageIndex, pageSize, cancellationToken);

        return new ListSubjectsResult(
            new PaginatedResult<Subject>(
                pageIndex,
                pageSize,
                subjects.Count,
                subjects));
    }
}
