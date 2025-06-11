using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Entities.Topics.Queries.GetTopicById;

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

    [HttpGet("{topicId}")]
    [ProducesResponseType(typeof(GetTopicByIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<GetTopicByIdResponse>> GetById([FromRoute] string topicId)
    {
        var result = await sender.Send(new GetTopicByIdQuery(topicId));
        var response = new GetTopicByIdResponse(result.Topic);

        return Ok(response);
    }
}
