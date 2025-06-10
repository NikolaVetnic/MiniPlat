using MediatR;
using Microsoft.AspNetCore.Identity;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.User.Commands.RegisterUser;

public class RegisterUserHandler(UserManager<ApplicationUser> userManager, ILecturersRepository lecturersRepository)
    : IRequestHandler<RegisterUserCommand, RegisterUserResult>
{
    public async Task<RegisterUserResult> Handle(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var user = new ApplicationUser
        {
            UserName = command.Username,
            Email = command.Email,
            FirstName = command.FirstName,
            LastName = command.LastName
        };

        var result = await userManager.CreateAsync(user, command.Password);

        if (!result.Succeeded)
        {
            return new RegisterUserResult
            {
                Succeeded = false,
                Errors = result.Errors.Select(e => e.Description)
            };
        }

        var lecturer = new Lecturer
        {
            Id = LecturerId.Of(Guid.NewGuid()),
            Title = command.Title,
            Department = command.Department,
            UserId = user.Id
        };

        await lecturersRepository.CreateLecturerAsync(lecturer, cancellationToken);

        return new RegisterUserResult
        {
            Succeeded = result.Succeeded,
            Errors = result.Errors.Select(e => e.Description)
        };
    }
}