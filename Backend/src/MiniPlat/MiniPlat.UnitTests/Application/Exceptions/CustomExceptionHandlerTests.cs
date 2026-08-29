using System.Text.Json;
using BuildingBlocks.Application.Exceptions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Application.Exceptions.Handlers;

namespace MiniPlat.UnitTests.Application.Exceptions;

public class CustomExceptionHandlerTests
{
    private static readonly IServiceProvider Services = new ServiceCollection().AddOptions().BuildServiceProvider();

    private static async Task<(int StatusCode, ProblemDetails Body)> Handle(Exception exception,
        string path = "/api/subjects")
    {
        var context = new DefaultHttpContext { RequestServices = Services };
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();

        var handled = await new CustomExceptionHandler(NullLogger<CustomExceptionHandler>.Instance)
            .TryHandleAsync(context, exception, CancellationToken.None);

        Assert.True(handled, "The handler has to claim the exception, or it reaches the client as a bare 500.");

        context.Response.Body.Position = 0;
        var body = await JsonSerializer.DeserializeAsync<ProblemDetails>(context.Response.Body,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        return (context.Response.StatusCode, body!);
    }

    [Fact]
    public async Task A_bad_request_becomes_a_400()
    {
        var (status, body) = await Handle(new BadRequestException("Provide isHidden, isDeleted, or both."));

        Assert.Equal(StatusCodes.Status400BadRequest, status);
        Assert.Equal("Provide isHidden, isDeleted, or both.", body.Detail);
        Assert.Equal(nameof(BadRequestException), body.Title);
    }

    [Fact]
    public async Task A_validation_failure_becomes_a_400()
    {
        var exception = new ValidationException([new ValidationFailure("Name", "Name is required.")]);

        var (status, _) = await Handle(exception);

        Assert.Equal(StatusCodes.Status400BadRequest, status);
    }

    /// <summary>
    /// The individual failures ride along beside the message, which is what lets the form mark
    /// the field that was wrong rather than showing one flattened sentence.
    /// </summary>
    [Fact]
    public async Task A_validation_failure_carries_the_individual_errors()
    {
        var exception = new ValidationException([
            new ValidationFailure("Name", "Name is required."),
            new ValidationFailure("Email", "Email is required.")
        ]);

        var (_, body) = await Handle(exception);

        Assert.True(body.Extensions.ContainsKey("ValidationErrors"));
    }

    /// <summary>
    /// Every not-found in the application layer derives from this one, so a new one is a 404 the
    /// day it is written rather than the day someone remembers to extend the switch.
    /// </summary>
    [Theory]
    [MemberData(nameof(NotFoundExceptions))]
    public async Task Anything_that_was_not_found_becomes_a_404(Exception exception)
    {
        var (status, _) = await Handle(exception);

        Assert.Equal(StatusCodes.Status404NotFound, status);
    }

    public static TheoryData<Exception> NotFoundExceptions =>
    [
        new SubjectNotFoundException(Guid.NewGuid().ToString()),
        new TopicNotFoundException(Guid.NewGuid().ToString()),
        new LecturerNotFoundException("ana"),
        new NotFoundException("Nothing here.")
    ];

    [Fact]
    public async Task A_stale_write_becomes_a_409()
    {
        var (status, _) = await Handle(new ConcurrencyException("Someone else changed this subject."));

        Assert.Equal(StatusCodes.Status409Conflict, status);
    }

    [Fact]
    public async Task A_caller_reaching_past_what_they_own_becomes_a_403()
    {
        var (status, _) = await Handle(new ForbiddenException("You may only edit subjects you teach."));

        Assert.Equal(StatusCodes.Status403Forbidden, status);
    }

    [Fact]
    public async Task An_internal_server_exception_becomes_a_500()
    {
        var (status, _) = await Handle(new InternalServerException("Something gave way."));

        Assert.Equal(StatusCodes.Status500InternalServerError, status);
    }

    [Fact]
    public async Task An_exception_nobody_planned_for_becomes_a_500()
    {
        var (status, _) = await Handle(new InvalidOperationException("Unexpected."));

        Assert.Equal(StatusCodes.Status500InternalServerError, status);
    }

    [Fact]
    public async Task The_reply_names_the_request_it_belongs_to()
    {
        var (_, body) = await Handle(new BadRequestException("No."), path: "/api/subjects/1/topics/order");

        Assert.Equal("/api/subjects/1/topics/order", body.Instance);
        Assert.True(body.Extensions.ContainsKey("traceId"));
    }

    [Fact]
    public async Task The_status_written_into_the_body_is_the_status_on_the_response()
    {
        var (status, body) = await Handle(new ForbiddenException("No."));

        Assert.Equal(status, body.Status);
    }
}
