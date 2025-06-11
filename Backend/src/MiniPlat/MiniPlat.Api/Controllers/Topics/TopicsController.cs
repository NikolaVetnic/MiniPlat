using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Api.Controllers.Subjects;
using MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;
using MiniPlat.Application.Entities.Topics.Commands.DeleteTopic;
using MiniPlat.Application.Entities.Topics.Queries.GetTopicById;
using MiniPlat.Application.Entities.Topics.Queries.ListTopics;
using MiniPlat.Application.Pagination;

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

    [HttpGet]
    [ProducesResponseType(typeof(ListTopicsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequireApiKey]
    public async Task<ActionResult<ListTopicsResponse>> List([FromQuery] PaginationRequest query)
    {
        var result = await sender.Send(new ListTopicsQuery(query));
        var response = new ListTopicsResponse(result.Topics);

        return Ok(response);
    }

    [HttpDelete("{topicId}")]
    [ProducesResponseType(typeof(DeleteTopicResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<DeleteTopicResponse>> Delete([FromRoute] string topicId)
    {
        var result = await sender.Send(new DeleteTopicCommand(topicId));
        var response = new DeleteTopicResponse(result.IsTopicDeleted);

        return Ok(response);
    }
}
