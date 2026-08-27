using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;
using MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;
using OpenIddict.Validation.AspNetCore;

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

    /// <summary>
    /// The full staff roster. Token-protected rather than api-key-protected: the api key ships
    /// inside the frontend bundle, so it would leave the roster readable by anyone.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ListLecturersResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public async Task<ActionResult<ListLecturersResponse>> List()
    {
        var result = await sender.Send(new ListLecturersQuery());
        var response = new ListLecturersResponse(result.Lecturers);

        return Ok(response);
    }
}
