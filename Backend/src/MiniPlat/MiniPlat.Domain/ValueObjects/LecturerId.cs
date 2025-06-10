using System.Text.Json;
using System.Text.Json.Serialization;
using MiniPlat.Domain.Abstractions;

namespace MiniPlat.Domain.ValueObjects;

[JsonConverter(typeof(LecturerIdJsonConverter))]
public class LecturerId : StronglyTypedId
{
    private LecturerId(Guid value) : base(value) { }

    public static LecturerId Of(Guid value) => new(value);

    public override string ToString() => Value.ToString();

    public override bool Equals(object? obj)
    {
        return obj is LecturerId other && Value == other.Value;
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }
}

public class LecturerIdJsonConverter : JsonConverter<LecturerId>
{
    public override LecturerId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // ReSharper disable once SwitchStatementHandlesSomeKnownEnumValuesWithDefault
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
            {
                var guidString = reader.GetString();
                if (!Guid.TryParse(guidString, out var guid))
                    throw new JsonException($"Invalid GUID format for LecturerId: {guidString}");

                return LecturerId.Of(guid);
            }
            case JsonTokenType.StartObject:
            {
                using var jsonDoc = JsonDocument.ParseValue(ref reader);

                if (!jsonDoc.RootElement.TryGetProperty("id", out JsonElement idElement))
                    throw new JsonException("Expected property 'id' not found.");

                var guidString = idElement.GetString();

                if (!Guid.TryParse(guidString, out var guid))
                    throw new JsonException($"Invalid GUID format for LecturerId: {guidString}");

                return LecturerId.Of(guid);
            }
            default:
                throw new JsonException(
                    $"Unexpected token parsing LecturerId. Expected String or StartObject, got {reader.TokenType}.");
        }
    }

    public override void Write(Utf8JsonWriter writer, LecturerId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}