using Microsoft.AspNetCore.Mvc.ModelBinding;
using MiniPlat.Api.ModelBinding;

namespace MiniPlat.UnitTests.Api;

public class StronglyTypedIdModelBinderTests
{
    private sealed class SingleValueProvider(string name, string? value) : IValueProvider
    {
        public bool ContainsPrefix(string prefix) => prefix == name;

        public ValueProviderResult GetValue(string key) =>
            key == name && value is not null ? new ValueProviderResult(value) : ValueProviderResult.None;
    }

    private static async Task<DefaultModelBindingContext> Bind(Func<Guid, object> factory, string? routeValue)
    {
        var context = new DefaultModelBindingContext
        {
            ModelName = "subjectId",
            ModelState = new ModelStateDictionary(),
            ValueProvider = new SingleValueProvider("subjectId", routeValue)
        };

        await new StronglyTypedIdModelBinder(factory).BindModelAsync(context);

        return context;
    }

    [Fact]
    public async Task A_well_formed_id_in_the_route_becomes_the_typed_id()
    {
        var guid = Guid.NewGuid();

        var context = await Bind(value => SubjectId.Of(value), guid.ToString());

        Assert.True(context.Result.IsModelSet);
        Assert.Equal(SubjectId.Of(guid), context.Result.Model);
        Assert.True(context.ModelState.IsValid);
    }

    /// <summary>
    /// Without this the controller would parse the route itself and a malformed id would leave
    /// the handler as a FormatException, which reaches the client as a 500 rather than the 400
    /// it is.
    /// </summary>
    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("../etc/passwd")]
    public async Task An_id_that_is_not_a_guid_is_a_model_error_and_not_an_exception(string routeValue)
    {
        var context = await Bind(value => SubjectId.Of(value), routeValue);

        Assert.False(context.Result.IsModelSet);
        Assert.False(context.ModelState.IsValid);
        Assert.Contains(routeValue, context.ModelState["subjectId"]!.Errors.Single().ErrorMessage);
    }

    [Fact]
    public async Task A_route_with_no_value_at_all_is_a_model_error()
    {
        var context = await Bind(value => SubjectId.Of(value), routeValue: null);

        Assert.False(context.Result.IsModelSet);
        Assert.False(context.ModelState.IsValid);
    }

    /// <summary>
    /// The all-zero guid parses but is not a real id, and the id types throw for it. Left to
    /// them the throw escapes the binder as a 500, so it is refused here as the bad request it
    /// is - the same answer as any other malformed id.
    /// </summary>
    [Fact]
    public async Task The_empty_guid_is_refused_like_any_other_malformed_id()
    {
        var context = await Bind(value => SubjectId.Of(value), Guid.Empty.ToString());

        Assert.False(context.Result.IsModelSet);
        Assert.False(context.ModelState.IsValid);
    }

    [Fact]
    public async Task A_guid_in_any_of_the_shapes_dotnet_accepts_binds()
    {
        var guid = Guid.NewGuid();

        foreach (var format in new[] { "D", "N", "B", "P" })
        {
            var context = await Bind(value => SubjectId.Of(value), guid.ToString(format));

            Assert.Equal(SubjectId.Of(guid), context.Result.Model);
        }
    }
}

public class StronglyTypedIdModelBinderProviderTests
{
    private static IModelBinder? BinderFor(Type modelType)
    {
        var context = Substitute.For<ModelBinderProviderContext>();
        context.Metadata.Returns(new EmptyModelMetadataProvider().GetMetadataForType(modelType));

        return new StronglyTypedIdModelBinderProvider().GetBinder(context);
    }

    [Theory]
    [InlineData(typeof(SubjectId))]
    [InlineData(typeof(TopicId))]
    [InlineData(typeof(MaterialId))]
    public void Every_id_that_appears_in_a_route_has_a_binder(Type idType)
    {
        Assert.IsType<StronglyTypedIdModelBinder>(BinderFor(idType));
    }

    [Theory]
    [InlineData(typeof(Guid))]
    [InlineData(typeof(string))]
    [InlineData(typeof(Subject))]
    public void Anything_else_is_left_to_the_binders_that_already_handle_it(Type modelType)
    {
        Assert.Null(BinderFor(modelType));
    }

    /// <summary>
    /// LecturerId is not in the table because no route takes one - lecturers are addressed by
    /// username. A route that started taking one would silently fail to bind without this line.
    /// </summary>
    [Fact]
    public void A_lecturer_id_has_no_binder_because_no_route_takes_one()
    {
        Assert.Null(BinderFor(typeof(LecturerId)));
    }
}
