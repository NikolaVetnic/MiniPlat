using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Materials.Commands.UpdateMaterial;

public record UpdateMaterialCommand : ICommand<UpdateMaterialResult>
{
    public required MaterialId Id { get; init; }
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public record UpdateMaterialResult(Material Material);
