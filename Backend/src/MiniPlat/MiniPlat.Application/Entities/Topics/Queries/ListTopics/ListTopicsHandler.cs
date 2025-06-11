using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Topics.Queries.ListTopics;

internal class ListTopicsHandler(ITopicsRepository topicsRepository) : IQueryHandler<ListTopicsQuery, ListTopicsResult>
{
    public async Task<ListTopicsResult> Handle(ListTopicsQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var topics = await topicsRepository.ListAsync(pageIndex, pageSize, cancellationToken);

        return new ListTopicsResult(
            new PaginatedResult<Topic>(
                pageIndex,
                pageSize,
                topics.Count,
                topics));
    }
}
