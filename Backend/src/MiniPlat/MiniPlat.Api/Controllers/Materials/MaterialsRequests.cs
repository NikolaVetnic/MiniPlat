using MiniPlat.Application.Entities.Materials.Commands.CreateMaterial;

namespace MiniPlat.Api.Controllers.Materials;

public class CreateMaterialRequest
{
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public static class TopicRequestExtensions
{
    public static CreateMaterialCommand ToCommand(this CreateMaterialRequest request)
    {
        return new CreateMaterialCommand
        {
            Description = request.Description,
            Link = request.Link
        };
    }
}
