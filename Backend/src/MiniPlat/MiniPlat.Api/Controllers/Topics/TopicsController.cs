using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;

namespace MiniPlat.Api.Controllers.Topics;

[ApiController]
[Route("api/[controller]")]
public class TopicsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [RequireApiKey]
    public async Task<IActionResult> Create([FromBody] CreateTopicRequest request)
    {
        var result = await sender.Send(request.ToCommand());
        var response = new CreateTopicResponse(result.TopicId);

        return CreatedAtAction(nameof(Create), new { id = response.TopicId }, response);
    }
}
