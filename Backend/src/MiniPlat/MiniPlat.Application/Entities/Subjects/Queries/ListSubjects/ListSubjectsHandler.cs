using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;

internal class ListSubjectsHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository) : IQueryHandler<ListSubjectsQuery, ListSubjectsResult>
{
    public async Task<ListSubjectsResult> Handle(ListSubjectsQuery query, CancellationToken cancellationToken)
    {
        var pagination = query.PaginationRequest.Normalized();
        var pageIndex = pagination.PageIndex;
        var pageSize = pagination.PageSize;

        var (subjects, totalCount) = await subjectsRepository.ListAsync(SubjectViewer.For(currentUser), pageIndex, pageSize, cancellationToken);

        return new ListSubjectsResult(
            new PaginatedResult<Subject>(
                pageIndex,
                pageSize,
                totalCount,
                subjects.Redact(currentUser)));
    }
}
