using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Materials.Commands.DeleteMaterial;

internal class DeleteMaterialHandler(IMaterialsRepository materialsRepository) : ICommandHandler<DeleteMaterialCommand, DeleteMaterialResult>
{
    public async Task<DeleteMaterialResult> Handle(DeleteMaterialCommand command, CancellationToken cancellationToken)
    {
        var material = await materialsRepository.GetById(command.Id, cancellationToken);
        await materialsRepository.DeleteMaterial(material.Id, cancellationToken);

        return new DeleteMaterialResult(true);
    }
}
