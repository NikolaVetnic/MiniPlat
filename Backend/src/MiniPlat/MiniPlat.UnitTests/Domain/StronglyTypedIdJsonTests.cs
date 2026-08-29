using System.Text.Json;
using MiniPlat.Domain.Abstractions;

namespace MiniPlat.UnitTests.Domain;

public class StronglyTypedIdJsonTests
{
    public static TheoryData<Type> IdTypes =>
    [
        typeof(SubjectId), typeof(TopicId), typeof(MaterialId), typeof(LecturerId)
    ];

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void An_id_serializes_as_a_bare_guid_string(Type idType)
    {
        var guid = Guid.NewGuid();
        var id = Create(idType, guid);

        var json = JsonSerializer.Serialize(id, idType);

        Assert.Equal($"\"{guid}\"", json);
    }

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void An_id_round_trips(Type idType)
    {
        var id = Create(idType, Guid.NewGuid());

        var restored = JsonSerializer.Deserialize(JsonSerializer.Serialize(id, idType), idType);

        Assert.Equal(id, restored);
    }

    /// <summary>
    /// The frontend sends topics back as objects that still carry their id, so the converter
    /// accepts the wrapping object as well as the bare string.
    /// </summary>
    [Theory]
    [MemberData(nameof(IdTypes))]
    public void An_id_can_be_read_from_an_object_carrying_an_id_property(Type idType)
    {
        var guid = Guid.NewGuid();

        var value = (StronglyTypedId)JsonSerializer.Deserialize($$"""{"id":"{{guid}}"}""", idType)!;

        Assert.Equal(guid, value.Value);
    }

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void A_string_that_is_not_a_guid_is_rejected(Type idType)
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize("\"not-a-guid\"", idType));
    }

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void An_object_without_an_id_property_is_rejected(Type idType)
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize("""{"value":"x"}""", idType));
    }

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void A_token_that_is_neither_a_string_nor_an_object_is_rejected(Type idType)
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize("42", idType));
    }

    [Theory]
    [MemberData(nameof(IdTypes))]
    public void The_empty_guid_is_rejected_on_the_way_in_too(Type idType)
    {
        Assert.ThrowsAny<Exception>(() => JsonSerializer.Deserialize($"\"{Guid.Empty}\"", idType));
    }

    private static object Create(Type idType, Guid value) =>
        idType.GetMethod("Of")!.Invoke(null, [value])!;
}
