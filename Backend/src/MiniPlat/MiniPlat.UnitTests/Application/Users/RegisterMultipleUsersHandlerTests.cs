using Microsoft.AspNetCore.Identity;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.User.Commands.RegisterUsers;

namespace MiniPlat.UnitTests.Application.Users;

public class RegisterMultipleUsersHandlerTests
{
    private readonly UserManager<ApplicationUser> _users = TestUserManager.Create();
    private readonly ILecturersRepository _lecturers = Substitute.For<ILecturersRepository>();

    private RegisterMultipleUsersHandler Handler() => new(_users, _lecturers);

    private static RegisterUserDto Dto(string username) => new()
    {
        Username = username,
        Email = $"{username}@example.test",
        Password = "Correct-horse-1",
        FirstName = username,
        LastName = "Example",
        Title = "Professor",
        Department = "Informatics"
    };

    private void CreationOf(string username, IdentityResult result) =>
        _users.CreateAsync(Arg.Is<ApplicationUser>(user => user.UserName == username), Arg.Any<string>())
            .Returns(result);

    private static IdentityResult Rejected(string description) =>
        IdentityResult.Failed(new IdentityError { Description = description });

    private Task<RegisterMultipleUsersResult> Register(params string[] usernames) =>
        Handler().Handle(new RegisterMultipleUsersCommand { Users = usernames.Select(Dto).ToList() },
            CancellationToken.None);

    [Fact]
    public async Task Everyone_in_the_batch_gets_a_user_and_a_lecturer()
    {
        foreach (var username in new[] { "ana", "bob", "carol" })
            CreationOf(username, IdentityResult.Success);

        var result = await Register("ana", "bob", "carol");

        Assert.True(result.Succeeded);
        Assert.Empty(result.FailedUsers);
        await _lecturers.Received(3).CreateLecturerAsync(Arg.Any<Lecturer>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// One bad row does not sink the batch: the import is what seeds a whole department at once,
    /// and stopping on the first duplicate username would leave the rest unimported.
    /// </summary>
    [Fact]
    public async Task One_rejected_registration_does_not_stop_the_rest()
    {
        CreationOf("ana", IdentityResult.Success);
        CreationOf("bob", Rejected("Username is taken."));
        CreationOf("carol", IdentityResult.Success);

        var result = await Register("ana", "bob", "carol");

        Assert.False(result.Succeeded);
        Assert.Equal("bob", Assert.Single(result.FailedUsers).Username);
        await _lecturers.Received(2).CreateLecturerAsync(Arg.Any<Lecturer>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task The_reasons_identity_gave_are_reported_against_the_user_they_belong_to()
    {
        CreationOf("bob", IdentityResult.Failed(
            new IdentityError { Description = "Username is taken." },
            new IdentityError { Description = "Email is taken." }));

        var result = await Register("bob");

        var failure = Assert.Single(result.FailedUsers);
        Assert.Equal(["Username is taken.", "Email is taken."], failure.Errors);
    }

    [Fact]
    public async Task A_rejected_user_gets_no_lecturer_record()
    {
        CreationOf("bob", Rejected("Username is taken."));

        await Register("bob");

        await _lecturers.DidNotReceive().CreateLecturerAsync(Arg.Any<Lecturer>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task An_empty_batch_succeeds_without_doing_anything()
    {
        var result = await Register();

        Assert.True(result.Succeeded);
        await _users.DidNotReceive().CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>());
    }

    [Fact]
    public async Task Every_rejected_row_in_the_batch_is_reported()
    {
        CreationOf("ana", Rejected("Username is taken."));
        CreationOf("bob", Rejected("Email is taken."));

        var result = await Register("ana", "bob");

        Assert.Equal(["ana", "bob"], result.FailedUsers.Select(failure => failure.Username));
    }
}

public class RegisterMultipleUsersCommandValidatorTests
{
    private readonly RegisterMultipleUsersCommandValidator _validator = new();

    [Fact]
    public void A_batch_where_someone_is_missing_a_name_is_rejected()
    {
        var command = new RegisterMultipleUsersCommand
        {
            Users =
            [
                new RegisterUserDto { FirstName = "Ana", LastName = "Aalto" },
                new RegisterUserDto { FirstName = "", LastName = "Berg" }
            ]
        };

        Assert.False(_validator.Validate(command).IsValid);
    }

    [Fact]
    public void A_batch_where_everyone_is_named_is_valid()
    {
        var command = new RegisterMultipleUsersCommand
        {
            Users = [new RegisterUserDto { FirstName = "Ana", LastName = "Aalto" }]
        };

        Assert.True(_validator.Validate(command).IsValid);
    }

    [Fact]
    public void An_empty_batch_is_valid()
    {
        Assert.True(_validator.Validate(new RegisterMultipleUsersCommand()).IsValid);
    }
}
