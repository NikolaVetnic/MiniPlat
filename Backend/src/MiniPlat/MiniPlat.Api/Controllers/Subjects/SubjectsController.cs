using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Authorization;
using MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;
using MiniPlat.Application.Entities.Subjects.Commands.ReorderTopics;
using MiniPlat.Application.Entities.Subjects.Commands.SetSubjectStaff;
using MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;
using MiniPlat.Application.Entities.Subjects.Commands.UpdateTopicState;
using MiniPlat.Application.Entities.Subjects.Queries.GetSubjectById;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.ValueObjects;
using OpenIddict.Validation.AspNetCore;

namespace MiniPlat.Api.Controllers.Subjects;

[ApiController]
[Route("api/[controller]")]
public class SubjectsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(CreateSubjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
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
    [AllowAnonymous]
    public async Task<ActionResult<GetSubjectByIdResponse>> GetById([FromRoute] SubjectId subjectId)
    {
        var result = await sender.Send(new GetSubjectByIdQuery(subjectId));
        var response = new GetSubjectByIdResponse(result.Subject);

        return Ok(response);
    }

    [HttpGet]
    [ProducesResponseType(typeof(ListSubjectsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [AllowAnonymous]
    public async Task<ActionResult<ListSubjectsResponse>> List([FromQuery] PaginationRequest query)
    {
        var result = await sender.Send(new ListSubjectsQuery(query));
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

    [HttpPut("{subjectId}")]
    [ProducesResponseType(typeof(UpdateSubjectResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public async Task<ActionResult<UpdateSubjectResponse>> Update([FromRoute] SubjectId subjectId,
        [FromBody] UpdateSubjectRequest request)
    {
        var command = new UpdateSubjectCommand
        {
            Id = subjectId,
            Title = request.Title,
            Code = request.Code,
            Description = request.Description,
            Level = request.Level,
            Semester = request.Semester,
            Lecturer = request.Lecturer,
            Assistant = request.Assistant,
            Topics = request.Topics,
            Version = request.Version,
        };
        
        var result = await sender.Send(command);
        var response = new UpdateSubjectResponse(result.Subject);
        
        return Ok(response);
    }

    [HttpPut("{subjectId}/topics/order")]
    [ProducesResponseType(typeof(ReorderTopicsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public async Task<ActionResult<ReorderTopicsResponse>> ReorderTopics([FromRoute] SubjectId subjectId,
        [FromBody] ReorderTopicsRequest request)
    {
        var command = new ReorderTopicsCommand(
            subjectId,
            request.TopicIds.Select(TopicId.Of).ToList());

        var result = await sender.Send(command);

        return Ok(new ReorderTopicsResponse(result.Reordered));
    }

    [HttpPatch("{subjectId}/topics/{topicId}")]
    [ProducesResponseType(typeof(UpdateTopicStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public async Task<ActionResult<UpdateTopicStateResponse>> UpdateTopicState([FromRoute] SubjectId subjectId,
        [FromRoute] TopicId topicId, [FromBody] UpdateTopicStateRequest request)
    {
        var command = new UpdateTopicStateCommand(
            subjectId,
            topicId,
            request.IsHidden,
            request.IsDeleted);

        var result = await sender.Send(command);

        return Ok(new UpdateTopicStateResponse(result.Updated));
    }

    [HttpPut("{subjectId}/staff")]
    [ProducesResponseType(typeof(SetSubjectStaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<SetSubjectStaffResponse>> SetStaff([FromRoute] SubjectId subjectId,
        [FromBody] SetSubjectStaffRequest request)
    {
        var command = new SetSubjectStaffCommand(
            subjectId,
            request.Lecturer,
            request.Assistant);

        var result = await sender.Send(command);

        return Ok(new SetSubjectStaffResponse(result.Updated));
    }

    [HttpDelete("{subjectId}")]
    [ProducesResponseType(typeof(DeleteSubjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<DeleteSubjectResponse>> Delete([FromRoute] SubjectId subjectId)
    {
        var result = await sender.Send(new DeleteSubjectCommand(subjectId));
        var response = new DeleteSubjectResponse(result.IsSubjectDeleted);

        return Ok(response);
    }
}