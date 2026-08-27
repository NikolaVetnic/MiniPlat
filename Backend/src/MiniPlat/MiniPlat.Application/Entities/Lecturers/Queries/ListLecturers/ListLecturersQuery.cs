using MiniPlat.Application.Cqrs;

namespace MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;

public record ListLecturersQuery : IQuery<ListLecturersResult>;

public record ListLecturersResult(IReadOnlyList<LecturerSummary> Lecturers);

/// <summary>
/// Minimal projection of a lecturer, holding only what a picker needs to show.
/// Deliberately not the <see cref="MiniPlat.Domain.Models.Lecturer"/> entity, whose
/// User navigation is an IdentityUser and would serialize password hashes and stamps.
/// </summary>
public record LecturerSummary(string Username, string? Title, string? FirstName, string? LastName);
