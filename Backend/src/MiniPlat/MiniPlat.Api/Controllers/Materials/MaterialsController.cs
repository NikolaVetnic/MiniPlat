using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Entities.Materials.Queries.GetMaterialById;

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

    [HttpGet("{materialId}")]
    [ProducesResponseType(typeof(GetMaterialByIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<GetMaterialByIdResponse>> GetById([FromRoute] string materialId)
    {
        var result = await sender.Send(new GetMaterialByIdQuery(materialId));
        var response = new GetMaterialByIdResponse(result.Material);

        return Ok(response);
    }
}
