using FluentValidation;
using MediatR;
using MiniPlat.Application.Behaviors;
using MiniPlat.Application.Cqrs;

namespace MiniPlat.UnitTests.Application.Behaviors;

public class ValidationBehaviorTests
{
    private record Command(string Name) : ICommand<string>;

    private record Query(string Name) : IQuery<string>;

    private sealed class NameRequired : AbstractValidator<Command>
    {
        public NameRequired() => RuleFor(command => command.Name).NotEmpty().WithMessage("Name is required.");
    }

    private sealed class NameIsLongEnough : AbstractValidator<Command>
    {
        public NameIsLongEnough() =>
            RuleFor(command => command.Name).MinimumLength(3).WithMessage("Name is too short.");
    }

    private sealed class QueryNameRequired : AbstractValidator<Query>
    {
        public QueryNameRequired() => RuleFor(query => query.Name).NotEmpty();
    }

    private static (RequestHandlerDelegate<string> Next, Func<int> Calls) Handler(string response = "handled")
    {
        var calls = 0;

        return (_ =>
        {
            calls++;
            return Task.FromResult(response);
        }, () => calls);
    }

    [Fact]
    public async Task With_no_validators_registered_the_request_goes_straight_through()
    {
        var behavior = new ValidationBehavior<Command, string>([]);
        var (next, calls) = Handler();

        var result = await behavior.Handle(new Command(""), next, CancellationToken.None);

        Assert.Equal("handled", result);
        Assert.Equal(1, calls());
    }

    [Fact]
    public async Task A_valid_request_reaches_the_handler_and_its_response_is_returned()
    {
        var behavior = new ValidationBehavior<Command, string>([new NameRequired()]);
        var (next, calls) = Handler();

        var result = await behavior.Handle(new Command("ana"), next, CancellationToken.None);

        Assert.Equal("handled", result);
        Assert.Equal(1, calls());
    }

    [Fact]
    public async Task An_invalid_request_never_reaches_the_handler()
    {
        var behavior = new ValidationBehavior<Command, string>([new NameRequired()]);
        var (next, calls) = Handler();

        await Assert.ThrowsAsync<ValidationException>(
            () => behavior.Handle(new Command(""), next, CancellationToken.None));

        Assert.Equal(0, calls());
    }

    /// <summary>
    /// The caller is told everything that is wrong at once, rather than one failure per attempt -
    /// and told it once. Each validator needs its own ValidationContext: FluentValidation returns
    /// a result wrapping the context's own failure list, so a context shared across validators
    /// hands every result the whole pile and the client sees each message repeated N times.
    /// </summary>
    [Fact]
    public async Task Failures_from_every_registered_validator_are_reported_together()
    {
        var behavior = new ValidationBehavior<Command, string>([new NameRequired(), new NameIsLongEnough()]);
        var (next, _) = Handler();

        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => behavior.Handle(new Command(""), next, CancellationToken.None));

        Assert.Equal(2, exception.Errors.Count());
        Assert.Contains(exception.Errors, failure => failure.ErrorMessage == "Name is required.");
        Assert.Contains(exception.Errors, failure => failure.ErrorMessage == "Name is too short.");
    }

    [Fact]
    public async Task A_request_that_satisfies_every_validator_is_handled()
    {
        var behavior = new ValidationBehavior<Command, string>([new NameRequired(), new NameIsLongEnough()]);
        var (next, calls) = Handler();

        await behavior.Handle(new Command("ana"), next, CancellationToken.None);

        Assert.Equal(1, calls());
    }

    /// <summary>
    /// The behavior is constrained on notnull rather than ICommand. Under the old constraint every
    /// query validator in the solution was registered and never ran, which is the sort of thing
    /// that looks exactly like working validation until someone sends bad input.
    /// </summary>
    [Fact]
    public async Task Queries_are_validated_and_not_only_commands()
    {
        var behavior = new ValidationBehavior<Query, string>([new QueryNameRequired()]);
        var (next, calls) = Handler();

        await Assert.ThrowsAsync<ValidationException>(
            () => behavior.Handle(new Query(""), next, CancellationToken.None));

        Assert.Equal(0, calls());
    }
}
