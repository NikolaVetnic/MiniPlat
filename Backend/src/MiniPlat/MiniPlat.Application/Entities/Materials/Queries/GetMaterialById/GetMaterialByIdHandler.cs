using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Materials.Queries.GetMaterialById;

internal class GetMaterialByIdHandler(IMaterialsRepository materialsRepository) : IQueryHandler<GetMaterialByIdQuery, GetMaterialByIdResult>
{
    public async Task<GetMaterialByIdResult> Handle(GetMaterialByIdQuery query, CancellationToken cancellationToken)
    {
        var material = await materialsRepository.GetById(query.Id, cancellationToken);

        return new GetMaterialByIdResult(material);
    }
}
