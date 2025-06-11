using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MiniPlat.Domain.Abstractions;

namespace MiniPlat.Domain.ValueObjects;

[JsonConverter(typeof(SubjectIdJsonConverter))]
public class SubjectId : StronglyTypedId
{
    private SubjectId(Guid value) : base(value) { }

    public static SubjectId Of(Guid value) => new(value);

    public override string ToString() => Value.ToString();

    public override bool Equals(object? obj)
    {
        return obj is SubjectId other && Value == other.Value;
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }
}

public class SubjectIdValueConverter : ValueConverter<SubjectId, Guid>
{
    public SubjectIdValueConverter()
        : base(
            subjectId => subjectId.Value, // Convert from NodeId to Guid
            guid => SubjectId.Of(guid)) // Convert from Guid to NodeId
    {
    }
}

public class SubjectIdJsonConverter : JsonConverter<SubjectId>
{
    public override SubjectId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // ReSharper disable once SwitchStatementHandlesSomeKnownEnumValuesWithDefault
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                {
                    var guidString = reader.GetString();
                    if (!Guid.TryParse(guidString, out var guid))
                        throw new JsonException($"Invalid GUID format for SubjectId: {guidString}");

                    return SubjectId.Of(guid);
                }
            case JsonTokenType.StartObject:
                {
                    using var jsonDoc = JsonDocument.ParseValue(ref reader);

                    if (!jsonDoc.RootElement.TryGetProperty("id", out JsonElement idElement))
                        throw new JsonException("Expected property 'id' not found.");

                    var guidString = idElement.GetString();

                    if (!Guid.TryParse(guidString, out var guid))
                        throw new JsonException($"Invalid GUID format for SubjectId: {guidString}");

                    return SubjectId.Of(guid);
                }
            default:
                throw new JsonException(
                    $"Unexpected token parsing SubjectId. Expected String or StartObject, got {reader.TokenType}.");
        }
    }

    public override void Write(Utf8JsonWriter writer, SubjectId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}
