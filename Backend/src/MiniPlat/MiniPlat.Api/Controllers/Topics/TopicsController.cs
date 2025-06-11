using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Api.Controllers.Topics;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
public class TopicsController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTopicRequest request)
    {
        var result = await sender.Send(request.ToCommand());
        var response = new CreateTopicResponse(result.TopicId);

        return CreatedAtAction(nameof(Create), new { id = response.TopicId }, response);
    }
}
