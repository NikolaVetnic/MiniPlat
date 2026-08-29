using FluentValidation;
using MiniPlat.Application.Cqrs;

namespace MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;

public record GetLecturerByUsernameQuery(string Username) : IQuery<GetLecturerByUsernameResult>;

public record GetLecturerByUsernameResult(LecturerDetails Lecturer);

/// <summary>
/// What a lecturer looks like over the wire. Deliberately not the
/// <see cref="MiniPlat.Domain.Models.Lecturer"/> entity: its User navigation is an
/// IdentityUser, and serializing that hands the caller the password hash, security
/// stamp and lockout state along with the name.
/// </summary>
public record LecturerDetails(
    string Username,
    string? Title,
    string? Department,
    string? FirstName,
    string? LastName,
    string? Email);

public class GetLecturerByUsernameQueryValidator : AbstractValidator<GetLecturerByUsernameQuery>
{
    public GetLecturerByUsernameQueryValidator()
    {
        RuleFor(query => query.Username)
            .NotEmpty().WithMessage("Username is required.")
            .MaximumLength(256).WithMessage("Username is too long.");
    }
}
