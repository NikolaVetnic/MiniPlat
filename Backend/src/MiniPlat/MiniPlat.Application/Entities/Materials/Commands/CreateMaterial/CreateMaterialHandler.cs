using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Materials.Commands.CreateMaterial;

internal class CreateMaterialHandler(IMaterialsRepository materialsRepository) : IRequestHandler<CreateMaterialCommand, CreateMaterialResult>
{
    public async Task<CreateMaterialResult> Handle(CreateMaterialCommand command, CancellationToken cancellationToken)
    {
        var material = command.ToMaterial();
        await materialsRepository.CreateAsync(material, cancellationToken);
        return new CreateMaterialResult(material.Id);
    }
}

internal static class CreateMaterialCommandExtensions
{
    public static Material ToMaterial(this CreateMaterialCommand command)
    {
        return Material.Create(
            MaterialId.Of(Guid.NewGuid()),
            command.Description,
            command.Link
        );
    }
}