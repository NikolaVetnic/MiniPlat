using Microsoft.AspNetCore.Mvc.ModelBinding;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.ModelBinding;

/// <summary>
/// Binds the strongly typed ids straight from the route. Without this a controller has to call
/// Guid.Parse itself, and a malformed id becomes a FormatException - which reaches the client as
/// a 500 rather than as the 400 it is. Registering it once means new endpoints get this for free.
/// </summary>
public class StronglyTypedIdModelBinder(Func<Guid, object> factory) : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName).FirstValue;

        // The all-zero guid is refused here rather than by the id type, which throws for it -
        // and an exception out of a model binder is a 500 where this is plainly a 400.
        if (Guid.TryParse(value, out var guid) && guid != Guid.Empty)
            bindingContext.Result = ModelBindingResult.Success(factory(guid));
        else
            bindingContext.ModelState.TryAddModelError(
                bindingContext.ModelName, $"'{value}' is not a valid id.");

        return Task.CompletedTask;
    }
}

public class StronglyTypedIdModelBinderProvider : IModelBinderProvider
{
    private static readonly Dictionary<Type, Func<Guid, object>> Factories = new()
    {
        [typeof(SubjectId)] = guid => SubjectId.Of(guid),
        [typeof(TopicId)] = guid => TopicId.Of(guid),
        [typeof(MaterialId)] = guid => MaterialId.Of(guid)
    };

    public IModelBinder? GetBinder(ModelBinderProviderContext context) =>
        Factories.TryGetValue(context.Metadata.ModelType, out var factory)
            ? new StronglyTypedIdModelBinder(factory)
            : null;
}
