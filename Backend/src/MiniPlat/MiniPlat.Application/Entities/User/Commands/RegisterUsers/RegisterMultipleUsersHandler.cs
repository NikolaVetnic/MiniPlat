using MediatR;
using Microsoft.AspNetCore.Identity;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.User.Commands.RegisterUsers;

public class RegisterMultipleUsersHandler(
    UserManager<ApplicationUser> userManager,
    ILecturersRepository lecturersRepository)
    : IRequestHandler<RegisterMultipleUsersCommand, RegisterMultipleUsersResult>
{
    public async Task<RegisterMultipleUsersResult> Handle(
        RegisterMultipleUsersCommand command,
        CancellationToken cancellationToken)
    {
        var failedUsers = new List<FailedUserResult>();

        foreach (var userDto in command.Users)
        {
            var user = new ApplicationUser
            {
                UserName = userDto.Username,
                Email = userDto.Email,
                FirstName = userDto.FirstName,
                LastName = userDto.LastName
            };

            var identityResult = await userManager.CreateAsync(user, userDto.Password);

            if (!identityResult.Succeeded)
            {
                failedUsers.Add(new FailedUserResult
                {
                    Username = userDto.Username,
                    Errors = identityResult.Errors.Select(e => e.Description)
                });
                continue; // Skip lecturer creation if user creation failed
            }

            var lecturer = new Lecturer
            {
                Id = LecturerId.Of(Guid.NewGuid()),
                Title = userDto.Title,
                Department = userDto.Department,
                UserId = user.Id
            };

            await lecturersRepository.CreateLecturerAsync(lecturer, cancellationToken);
        }

        return new RegisterMultipleUsersResult
        {
            FailedUsers = failedUsers
        };
    }
}