using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Materials.Commands.UpdateMaterial;

internal class UpdateMaterialHandler(IMaterialsRepository materialsRepository) : ICommandHandler<UpdateMaterialCommand, UpdateMaterialResult>
{
    public async Task<UpdateMaterialResult> Handle(UpdateMaterialCommand command, CancellationToken cancellationToken)
    {
        var material = await materialsRepository.GetById(command.Id, cancellationToken);

        material.Description = command.Description;
        material.Link = command.Link;

        await materialsRepository.UpdateMaterial(material, cancellationToken);

        return new UpdateMaterialResult(material);
    }
}
