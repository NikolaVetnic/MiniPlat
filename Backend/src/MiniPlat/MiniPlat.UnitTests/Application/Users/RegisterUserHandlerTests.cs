using Microsoft.AspNetCore.Identity;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.User.Commands.RegisterUser;

namespace MiniPlat.UnitTests.Application.Users;

public class RegisterUserHandlerTests
{
    private readonly UserManager<ApplicationUser> _users = TestUserManager.Create();
    private readonly ILecturersRepository _lecturers = Substitute.For<ILecturersRepository>();

    private RegisterUserHandler Handler() => new(_users, _lecturers);

    private static RegisterUserCommand Command() => new()
    {
        Username = "ana",
        Email = "ana@example.test",
        Password = "Correct-horse-1",
        FirstName = "Ana",
        LastName = "Aalto",
        Title = "Professor",
        Department = "Informatics"
    };

    private void CreationSucceeds() =>
        _users.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>()).Returns(IdentityResult.Success);

    private void CreationFails(params string[] descriptions) =>
        _users.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>()).Returns(IdentityResult.Failed(
            descriptions.Select(description => new IdentityError { Description = description }).ToArray()));

    [Fact]
    public async Task The_command_is_carried_onto_the_identity_user()
    {
        CreationSucceeds();
        ApplicationUser? created = null;
        _users.When(users => users.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>()))
            .Do(call => created = call.Arg<ApplicationUser>());

        await Handler().Handle(Command(), CancellationToken.None);

        Assert.NotNull(created);
        Assert.Equal("ana", created.UserName);
        Assert.Equal("ana@example.test", created.Email);
        Assert.Equal("Ana", created.FirstName);
        Assert.Equal("Aalto", created.LastName);
    }

    [Fact]
    public async Task The_password_is_handed_to_identity_to_hash_and_never_stored_on_the_user()
    {
        CreationSucceeds();

        await Handler().Handle(Command(), CancellationToken.None);

        await _users.Received(1).CreateAsync(
            Arg.Is<ApplicationUser>(user => user.PasswordHash == null), "Correct-horse-1");
    }

    [Fact]
    public async Task A_lecturer_record_is_created_and_tied_to_the_new_user()
    {
        CreationSucceeds();
        ApplicationUser? created = null;
        _users.When(users => users.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>()))
            .Do(call => created = call.Arg<ApplicationUser>());

        var result = await Handler().Handle(Command(), CancellationToken.None);

        Assert.True(result.Succeeded);
        await _lecturers.Received(1).CreateLecturerAsync(
            Arg.Is<Lecturer>(lecturer =>
                lecturer.Title == "Professor" &&
                lecturer.Department == "Informatics" &&
                lecturer.UserId == created!.Id),
            Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// No lecturer without a user behind it: the row's UserId would point at nothing, and every
    /// listing joins through it.
    /// </summary>
    [Fact]
    public async Task A_rejected_registration_leaves_no_lecturer_behind()
    {
        CreationFails("Passwords must have at least one digit.");

        var result = await Handler().Handle(Command(), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal(["Passwords must have at least one digit."], result.Errors);
        await _lecturers.DidNotReceive().CreateLecturerAsync(Arg.Any<Lecturer>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Every_reason_identity_gave_is_passed_back()
    {
        CreationFails("Username is taken.", "Passwords must have at least one digit.");

        var result = await Handler().Handle(Command(), CancellationToken.None);

        Assert.Equal(2, result.Errors.Count());
    }

    [Fact]
    public async Task A_successful_registration_reports_no_errors()
    {
        CreationSucceeds();

        var result = await Handler().Handle(Command(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Empty(result.Errors);
    }
}

public class RegisterUserCommandValidatorTests
{
    private readonly RegisterUserCommandValidator _validator = new();

    [Theory]
    [InlineData("", "Aalto")]
    [InlineData("Ana", "")]
    [InlineData("", "")]
    public void A_name_is_required_at_both_ends(string firstName, string lastName)
    {
        var command = new RegisterUserCommand { FirstName = firstName, LastName = lastName };

        Assert.False(_validator.Validate(command).IsValid);
    }

    [Fact]
    public void A_command_carrying_both_names_is_valid()
    {
        var command = new RegisterUserCommand { FirstName = "Ana", LastName = "Aalto" };

        Assert.True(_validator.Validate(command).IsValid);
    }
}
