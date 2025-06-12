using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Materials.Queries.ListMaterials;

internal class ListMaterialsHandler(IMaterialsRepository materialsRepository) : IQueryHandler<ListMaterialsQuery, ListMaterialsResult>
{
    public async Task<ListMaterialsResult> Handle(ListMaterialsQuery query, CancellationToken cancellationToken)
    {
        var pageIndex = query.PaginationRequest.PageIndex;
        var pageSize = query.PaginationRequest.PageSize;

        var subjects = await materialsRepository.ListAsync(pageIndex, pageSize, cancellationToken);

        return new ListMaterialsResult(
            new PaginatedResult<Material>(
                pageIndex,
                pageSize,
                subjects.Count,
                subjects));
    }
}
