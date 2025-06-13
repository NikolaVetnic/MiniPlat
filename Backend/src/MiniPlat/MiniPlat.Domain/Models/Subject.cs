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
    public List<Topic> Topics { get; set; } = [];

    public static Subject Create(SubjectId id, string title, string description, string code, Level level, int year,
        string lecturerId, string assistantId)
    {
        var subject = new Subject
        {
            Id = id,
            Title = title,
            Description = description,
            Code = code,
            Level = level,
            Year = year,
            Lecturer = lecturerId,
            Assistant = assistantId
        };

        return subject;
    }
}

public enum Level
{
    Undergraduate = 1,
    Master = 2
}
