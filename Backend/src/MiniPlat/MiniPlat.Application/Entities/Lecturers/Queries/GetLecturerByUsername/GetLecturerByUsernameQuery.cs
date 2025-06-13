using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;

public record GetLecturerByUsernameQuery(string UserId) : IQuery<GetLecturerByUsernameResult>;

public record GetLecturerByUsernameResult(Lecturer Lecturer);

public class GetLecturerByUsernameQueryValidator : AbstractValidator<GetLecturerByUsernameQuery>
{
    public GetLecturerByUsernameQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}