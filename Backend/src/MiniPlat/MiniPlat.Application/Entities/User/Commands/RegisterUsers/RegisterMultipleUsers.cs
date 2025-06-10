using FluentValidation;
using MiniPlat.Application.Cqrs;

namespace MiniPlat.Application.Entities.User.Commands.RegisterUsers;

# region Command

public class RegisterMultipleUsersCommand : ICommand<RegisterMultipleUsersResult>
{
    public List<RegisterUserDto> Users { get; set; } = [];
}

public class RegisterUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}

#endregion

#region Result

public class RegisterMultipleUsersResult
{
    public bool Succeeded => FailedUsers.Count == 0;
    public List<FailedUserResult> FailedUsers { get; set; } = [];
}

public class FailedUserResult
{
    public string Username { get; set; } = string.Empty;
    public IEnumerable<string> Errors { get; set; } = [];
}

#endregion

#region Validator

public class RegisterMultipleUsersCommandValidator : AbstractValidator<RegisterMultipleUsersCommand>
{
    public RegisterMultipleUsersCommandValidator()
    {
        RuleForEach(x => x.Users).SetValidator(new RegisterUserDtoValidator());
    }
}

public class RegisterUserDtoValidator : AbstractValidator<RegisterUserDto>
{
    public RegisterUserDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.");

        // ToDo: Add more validations (e.g. username, email, password)
    }
}

#endregion