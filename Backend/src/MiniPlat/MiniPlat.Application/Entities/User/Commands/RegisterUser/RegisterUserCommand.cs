using FluentValidation;
using MiniPlat.Application.Cqrs;

namespace MiniPlat.Application.Entities.User.Commands.RegisterUser;

public class RegisterUserCommand : ICommand<RegisterUserResult>
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}

public class RegisterUserResult
{
    public bool Succeeded { get; set; }
    public IEnumerable<string> Errors { get; set; } = [];
}

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required.");
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required.");

        // ToDo: Add remaining RegisterUser command validators
    }
}