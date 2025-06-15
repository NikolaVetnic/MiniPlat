using System.Reflection;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace MiniPlat.Infrastructure.Extensions;

public static class InitialDataLoader
{
    public static InitialDataContainer Load()
    {
        var assemblyPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
        var fullPath = Path.Combine(assemblyPath, "Data", "SeedData", "initialData.yml");

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Seed file not found at {fullPath}");
        else
            Console.WriteLine($"Reading initialData from {fullPath}");

        var yaml = File.ReadAllText(fullPath);

        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        var dtoContainer = deserializer.Deserialize<InitialDataDto>(yaml);

        return Map(dtoContainer);
    }

    private static InitialDataContainer Map(InitialDataDto dto) => new InitialDataContainer
    {
        SeededUsers = dto.Users.Select(u => new SeededUser
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Password = u.Password
        }).ToList(),

        SeededLecturers = dto.Lecturers.Select(l => new SeededLecturer
        {
            Id = LecturerId.Of(Guid.Parse(l.Id)),
            UserId = l.UserId,
            Title = l.Title,
            Position = l.Position,
            Department = l.Department
        }).ToList(),

        SeededSubjects = dto.Subjects.Select(s => new SeededSubject
        {
            Id = SubjectId.Of(Guid.Parse(s.Id)),
            Code = s.Code,
            Title = s.Title,
            Description = s.Description,
            Level = Enum.Parse<Level>(s.Level),
            Semester = s.Semester,
            Lecturer = s.Lecturer,
            Assistant = s.Assistant,
            Topics = s.Topics?.Select(t => new SeededTopic
            {
                Id = TopicId.Of(Guid.Parse(t.Id)),
                Title = t.Title,
                Description = t.Description,
                Order = t.Order,
                Materials = t.Materials?.Select(m => new SeededMaterial
                {
                    Id = MaterialId.Of(Guid.Parse(m.Id)),
                    Description = m.Description,
                    Link = m.Link,
                    Order = m.Order
                }).ToList() ?? new List<SeededMaterial>()
            }).ToList() ?? new List<SeededTopic>(),
            IsActive = s.IsActive,
        }).ToList()
    };
}

#region InitialData

public class InitialDataContainer
{
    public List<SeededUser> SeededUsers { get; init; } = [];
    public List<SeededLecturer> SeededLecturers { get; init; } = [];
    public List<SeededSubject> SeededSubjects { get; init; } = [];
}

internal class InitialDataDto
{
    public List<UserDto> Users { get; init; } = [];
    public List<LecturerDto> Lecturers { get; init; } = [];
    public List<SubjectDto> Subjects { get; init; } = [];
}

#endregion

#region User

public class SeededUser
{
    public required string Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Password { get; init; }
}

public class UserDto
{
    public required string Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Password { get; init; }
}

#endregion

#region Lecturer

public class SeededLecturer
{
    public required LecturerId Id { get; init; }
    public required string UserId { get; init; }
    public required string Title { get; init; }
    public required string Position { get; init; }
    public required string Department { get; init; }
}

public class LecturerDto
{
    public required string Id { get; init; }
    public required string UserId { get; init; }
    public required string Title { get; init; }
    public required string Position { get; init; }
    public required string Department { get; init; }
}

#endregion

#region Subject

public class SeededSubject
{
    public required SubjectId Id { get; init; }
    public required string Code { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required Level Level { get; init; }
    public required int Semester { get; init; }
    public required string Lecturer { get; init; }
    public required string? Assistant { get; init; }
    public List<SeededTopic> Topics { get; init; } = [];
    public required bool IsActive { get; init; }
}

public class SubjectDto
{
    public required string Id { get; init; }
    public required string Code { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Level { get; init; } // serialized as string like "Undergraduate"
    public required int Semester { get; init; }
    public required string Lecturer { get; init; }
    public required string? Assistant { get; init; }
    public List<TopicDto>? Topics { get; init; } = [];
    public required bool IsActive { get; init; }
}

#endregion

#region Topic

public class SeededTopic
{
    public required TopicId Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required int Order { get; init; }
    public List<SeededMaterial> Materials { get; init; } = [];
}

public class TopicDto
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required int Order { get; init; }
    public List<MaterialDto>? Materials { get; init; } = [];
}

#endregion

#region Material

public class SeededMaterial
{
    public required MaterialId Id { get; init; }
    public required string Description { get; init; }
    public required string Link { get; init; }
    public required int Order { get; init; }
}

public class MaterialDto
{
    public required string Id { get; init; }
    public required string Description { get; init; }
    public required string Link { get; init; }
    public required int Order { get; init; }
}

#endregion