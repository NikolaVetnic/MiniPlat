using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Application.Entities.Subject.Commands.CreateSubject;
using MiniPlat.Application.Entities.Subject.Queries.GetSubjectById;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Api.Controllers.Subjects;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
public class SubjectController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectRequest request)
    {
        var command = request.Adapt<CreateSubjectCommand>();
        var result = await sender.Send(command);
        var response = result.Adapt<CreateSubjectResponse>();

        return CreatedAtAction(nameof(CreateSubject), new { id = response.SubjectId }, response);
    }

    [HttpGet("{subjectId}")]
    [ProducesResponseType(typeof(GetSubjectByIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetSubjectByIdResponse>> GetById([FromRoute] string subjectId)
    {
        var result = await sender.Send(new GetSubjectByIdQuery(subjectId));

        var response = new GetSubjectByIdResponse
        {
            Code = result.Subject.Code,
            Title = result.Subject.Title,
            Description = result.Subject.Description,
            Level = result.Subject.Level,
            Year = result.Subject.Year,
            Lecturer = result.Subject.Lecturer,
            Assistant = result.Subject.Assistant
        };

        return Ok(response);
    }
}
