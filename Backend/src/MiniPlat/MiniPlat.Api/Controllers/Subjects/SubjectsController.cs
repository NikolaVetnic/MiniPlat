using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;
using MiniPlat.Application.Entities.Subjects.Queries.GetSubjectById;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;
using MiniPlat.Application.Pagination;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Api.Controllers.Subjects;

[ApiController]
[Route("api/[controller]")]
public class SubjectsController(ISender sender, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost]
    [RequireApiKey]
    public async Task<IActionResult> Create([FromBody] CreateSubjectRequest request)
    {
        var result = await sender.Send(request.ToCommand());
        var response = new CreateSubjectResponse(result.SubjectId);

        return CreatedAtAction(nameof(Create), new { id = response.SubjectId }, response);
    }

    [HttpGet("{subjectId}")]
    [ProducesResponseType(typeof(GetSubjectByIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<GetSubjectByIdResponse>> GetById([FromRoute] string subjectId)
    {
        var result = await sender.Send(new GetSubjectByIdQuery(subjectId));
        var response = new GetSubjectByIdResponse(result.Subject);

        return Ok(response);
    }

    [HttpGet]
    [ProducesResponseType(typeof(ListSubjectsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequireApiKey]
    public async Task<ActionResult<ListSubjectsResponse>> List([FromQuery] PaginationRequest query)
    {
        var result = await sender.Send(new ListSubjectsQuery(query));
        var response = new ListSubjectsResponse(result.Subjects);

        return Ok(response);
    }

    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ListSubjectsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequireApiKey]
    public async Task<ActionResult<ListSubjectsResponse>> GetByUserIdPublic(
        [FromRoute] string userId,
        [FromQuery] PaginationRequest query)
    {
        var result = await sender.Send(new ListSubjectsByUserIdQuery(userId, query));
        var response = new ListSubjectsResponse(result.Subjects);

        return Ok(response);
    }

    [HttpGet("user")]
    [ProducesResponseType(typeof(ListSubjectsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public async Task<ActionResult<ListSubjectsResponse>> GetByUsername([FromQuery] PaginationRequest query)
    {
        var result = await sender.Send(new ListSubjectsByUserIdQuery(query));
        var response = new ListSubjectsResponse(result.Subjects);

        return Ok(response);
    }

    [HttpDelete("{subjectId}")]
    [ProducesResponseType(typeof(DeleteSubjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequireApiKey]
    public async Task<ActionResult<DeleteSubjectResponse>> Delete([FromRoute] string subjectId)
    {
        var result = await sender.Send(new DeleteSubjectCommand(subjectId));
        var response = new DeleteSubjectResponse(result.IsSubjectDeleted);

        return Ok(response);
    }
}