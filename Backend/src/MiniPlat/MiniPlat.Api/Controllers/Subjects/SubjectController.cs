using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Application.Entities.Subject.Commands.CreateSubject;
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
}
