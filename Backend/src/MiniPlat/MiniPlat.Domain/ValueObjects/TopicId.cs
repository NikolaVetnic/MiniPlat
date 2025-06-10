using System.Text.Json;
using System.Text.Json.Serialization;
using MiniPlat.Domain.Abstractions;

namespace MiniPlat.Domain.ValueObjects;

[JsonConverter(typeof(TopicIdJsonConverter))]
public class TopicId : StronglyTypedId
{
    private TopicId(Guid value) : base(value) { }

    public static TopicId Of(Guid value) => new(value);

    public override string ToString() => Value.ToString();

    public override bool Equals(object? obj)
    {
        return obj is TopicId other && Value == other.Value;
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }
}

public class TopicIdJsonConverter : JsonConverter<TopicId>
{
    public override TopicId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // ReSharper disable once SwitchStatementHandlesSomeKnownEnumValuesWithDefault
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                {
                    var guidString = reader.GetString();
                    if (!Guid.TryParse(guidString, out var guid))
                        throw new JsonException($"Invalid GUID format for TopicId: {guidString}");

                    return TopicId.Of(guid);
                }
            case JsonTokenType.StartObject:
                {
                    using var jsonDoc = JsonDocument.ParseValue(ref reader);

                    if (!jsonDoc.RootElement.TryGetProperty("id", out JsonElement idElement))
                        throw new JsonException("Expected property 'id' not found.");

                    var guidString = idElement.GetString();

                    if (!Guid.TryParse(guidString, out var guid))
                        throw new JsonException($"Invalid GUID format for TopicId: {guidString}");

                    return TopicId.Of(guid);
                }
            default:
                throw new JsonException(
                    $"Unexpected token parsing TopicId. Expected String or StartObject, got {reader.TokenType}.");
        }
    }

    public override void Write(Utf8JsonWriter writer, TopicId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}
