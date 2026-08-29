using FluentValidation;
using MediatR;

namespace MiniPlat.Application.Behaviors;

/// <summary>
/// Runs any registered validator for the request. Covers queries as well as commands: the
/// constraint used to be ICommand, which quietly left every query validator in the solution
/// dormant - including one that would have rejected all its own valid input.
/// </summary>
public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // A context per validator. FluentValidation returns a result that wraps the context's own
        // failure list, so one shared context hands every result the whole pile and the caller is
        // told each thing that is wrong once per registered validator.
        var validationResults = await Task.WhenAll(validators.Select(v =>
            v.ValidateAsync(new ValidationContext<TRequest>(request), cancellationToken)));

        var failures = validationResults
            .Where(r => r.Errors.Any())
            .SelectMany(r => r.Errors)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next(cancellationToken);
    }
}