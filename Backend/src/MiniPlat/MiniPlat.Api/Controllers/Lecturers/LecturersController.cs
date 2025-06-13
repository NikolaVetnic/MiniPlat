using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;

namespace MiniPlat.Api.Controllers.Lecturers;

[ApiController]
[Route("api/[controller]")]
public class LecturersController(ISender sender) : ControllerBase
{
    [HttpGet("{username}")]
    [ProducesResponseType(typeof(GetLecturerByUsernameResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<GetLecturerByUsernameResponse>> GetByUsername([FromRoute] string username)
    {
        var result = await sender.Send(new GetLecturerByUsernameQuery(username));
        var response = new GetLecturerByUsernameResponse(result.Lecturer);

        return Ok(response);
    }
}