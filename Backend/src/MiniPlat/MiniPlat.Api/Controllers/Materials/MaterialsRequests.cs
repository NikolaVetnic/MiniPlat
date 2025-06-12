using MiniPlat.Application.Entities.Materials.Commands.CreateMaterial;
using MiniPlat.Application.Entities.Materials.Commands.UpdateMaterial;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Materials;

public class CreateMaterialRequest
{
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public class UpdateMaterialRequest
{
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public static class MaterialRequestExtensions
{
    public static CreateMaterialCommand ToCommand(this CreateMaterialRequest request)
    {
        return new CreateMaterialCommand
        {
            Description = request.Description,
            Link = request.Link
        };
    }

    public static UpdateMaterialCommand ToCommand(this UpdateMaterialRequest request, string materialId)
    {
        return new UpdateMaterialCommand
        {
            Id = MaterialId.Of(Guid.Parse(materialId)),
            Description = request.Description,
            Link = request.Link
        };
    }
}
