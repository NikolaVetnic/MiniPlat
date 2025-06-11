using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure.Extensions;

internal static class InitialData
{
    public static IEnumerable<SeededUser> SeededUsers =>
        new List<SeededUser>
        {
            new()
            {
                Id = "11111111-1111-1111-1111-111111111111",
                Username = "USRa",
                Email = "USRa@email.com",
                FirstName = "User",
                LastName = "Alpha",
                Password = "P@ssw0rd!123"
            },
            new()
            {
                Id = "22222222-2222-2222-2222-222222222222",
                Username = "USRb",
                Email = "USRb@email.com",
                FirstName = "User",
                LastName = "Beta",
                Password = "P@ssw0rd?456"
            },
            new()
            {
                Id = "33333333-3333-3333-3333-333333333333",
                Username = "USRc",
                Email = "USRc@email.com",
                FirstName = "User",
                LastName = "Gamma",
                Password = "P@ssw0rd.789"
            }
        };

    public static IEnumerable<SeededLecturer> SeededLecturers =>
        new List<SeededLecturer>
        {
            new()
            {
                Id = LecturerId.Of(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")),
                UserId = "11111111-1111-1111-1111-111111111111",
                Title = "dr",
                Department = "Računarske nauke",
            },
            new()
            {
                Id = LecturerId.Of(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")),
                UserId = "22222222-2222-2222-2222-222222222222",
                Title = "MA",
                Department = "Matematika",
            }
        };

    public static IEnumerable<SeededSubject> SeededSubjects =>
        new List<SeededSubject>
        {
            new()
            {
                Id = SubjectId.Of(Guid.Parse("112f020b-f871-47ee-a1f4-b4cc8aa2dd53")),
                Code = "CS101",
                Title = "SPA",
                Description = "Strukture podataka i algoritmi",
                Level = Level.Undergraduate,
                Year = 1,
                LecturerId = "11111111-1111-1111-1111-111111111111",
                AssistantId = "33333333-3333-3333-3333-333333333333",
                UserId = "22222222-2222-2222-2222-222222222222",
                TopicIds = [TopicId.Of(Guid.Parse("47acc4e5-659b-4ed2-9f5f-8ba6606416a7")), TopicId.Of(Guid.Parse("b6416381-eeb9-4b84-8936-8c73772f7f4c"))]
            },

            new()
            {
                Id = SubjectId.Of(Guid.Parse("88e05977-cbd8-413c-a83f-869d4e9e2a63")),
                Code = "MAT123",
                Title = "Analiza 1",
                Description = "Single Variable Calculus",
                Level = Level.Undergraduate,
                Year = 2,
                LecturerId = "11111111-1111-1111-1111-111111111111",
                AssistantId = "33333333-3333-3333-3333-333333333333",
                UserId = "22222222-2222-2222-2222-222222222222",
                TopicIds = [TopicId.Of(Guid.Parse("26718d3b-235f-4ff1-97fe-5c172f114bb0"))]
            }
        };

    public static IEnumerable<SeededTopic> SeededTopics =>
        new List<SeededTopic>
        {
            new()
            {
                Id = TopicId.Of(Guid.Parse("47acc4e5-659b-4ed2-9f5f-8ba6606416a7")),
                Title = "Uvod u algoritme",
                Description = "Osnovni koncepti algoritama, sortiranje i pretraga",
                IsHidden = false,
                UserId = "11111111-1111-1111-1111-111111111111",
                SubjectId = SubjectId.Of(Guid.Parse("112f020b-f871-47ee-a1f4-b4cc8aa2dd53"))
            },
            new()
            {
                Id = TopicId.Of(Guid.Parse("b6416381-eeb9-4b84-8936-8c73772f7f4c")),
                Title = "Rekurzija",
                Description = "Tehnike i primena rekurzije u programiranju",
                IsHidden = false,
                UserId = "11111111-1111-1111-1111-111111111111",
                SubjectId = SubjectId.Of(Guid.Parse("112f020b-f871-47ee-a1f4-b4cc8aa2dd53"))
            },
            new()
            {
                Id = TopicId.Of(Guid.Parse("26718d3b-235f-4ff1-97fe-5c172f114bb0")),
                Title = "Integralni račun",
                Description = "Primena integralnog računa u rešavanju problema",
                IsHidden = false,
                UserId = "22222222-2222-2222-2222-222222222222",
                SubjectId = SubjectId.Of(Guid.Parse("88e05977-cbd8-413c-a83f-869d4e9e2a63"))
            }
        };
}

public class SeededUser
{
    public required string Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Password { get; init; }
}

public class SeededLecturer
{
    public required LecturerId Id { get; init; }
    public required string UserId { get; init; }
    public required string Title { get; init; }
    public required string Department { get; init; }
}

public class SeededSubject
{
    public required SubjectId Id { get; init; }
    public required string Code { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required Level Level { get; init; }
    public required int Year { get; init; }
    public required string LecturerId { get; init; }
    public required string AssistantId { get; init; }
    public required string UserId { get; init; }
    public List<TopicId> TopicIds { get; init; } = [];  
}

public class SeededTopic
{
    public required TopicId Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required bool IsHidden { get; init; }
    public required string UserId { get; init; }
    public required SubjectId SubjectId { get; init; }
}