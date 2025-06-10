using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUserId;

public record GetLecturerByUserIdQuery(string UserId) : IQuery<GetLecturerByUserIdResult>;

public record GetLecturerByUserIdResult(Lecturer Lecturer);

public class GetLecturerByUserIdQueryValidator : AbstractValidator<GetLecturerByUserIdQuery>
{
    public GetLecturerByUserIdQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}