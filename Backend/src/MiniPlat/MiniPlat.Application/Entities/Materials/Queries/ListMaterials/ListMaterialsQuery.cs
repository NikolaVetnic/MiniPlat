using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Materials.Queries.ListMaterials;

public record ListMaterialsQuery(PaginationRequest PaginationRequest) : IQuery<ListMaterialsResult>;

public record ListMaterialsResult(PaginatedResult<Material> Materials);
