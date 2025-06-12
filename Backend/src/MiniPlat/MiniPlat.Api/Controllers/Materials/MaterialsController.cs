using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;

namespace MiniPlat.Api.Controllers.Materials;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [RequireApiKey]
    public async Task<IActionResult> Create([FromBody] CreateMaterialRequest request)
    {
        var result = await sender.Send(request.ToCommand());
        var response = new CreateMaterialResponse(result.MaterialId);

        return CreatedAtAction(nameof(Create), new { id = response.MaterialId }, response);
    }
}
