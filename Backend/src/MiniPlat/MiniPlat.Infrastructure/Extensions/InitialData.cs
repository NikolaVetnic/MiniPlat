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