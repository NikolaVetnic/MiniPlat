using System.Text.Json;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MiniPlat.Domain.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Domain.Models;

public class Subject : Entity<SubjectId>
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
    public string UserId { get; set; } = null!;
    public List<TopicId> TopicIds { get; set; } = [];

    public static Subject Create(SubjectId id, string title, string description, string code, Level level, int year, string lecturer, string assistant, string userId)
    {
        var subject = new Subject
        {
            Id = id,
            Title = title,
            Description = description,
            Code = code,
            Level = level,
            Year = year,
            Lecturer = lecturer,
            Assistant = assistant,
            UserId = userId
        };

        subject.TopicIds = [];

        return subject;
    }
}

public class TopicIdListConverter() : ValueConverter<List<TopicId>, string>(
    list => JsonSerializer.Serialize(list, (JsonSerializerOptions)null!),
    json => JsonSerializer.Deserialize<List<TopicId>>(json, new JsonSerializerOptions()) ?? new List<TopicId>());
