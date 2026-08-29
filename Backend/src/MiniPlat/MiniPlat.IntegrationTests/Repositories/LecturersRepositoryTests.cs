using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Exceptions;
using MiniPlat.Infrastructure.Repositories;

namespace MiniPlat.IntegrationTests.Repositories;

public class LecturersRepositoryTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    private async Task<ApplicationUser> StoreLecturer(string username, string? firstName = "Ana",
        string? lastName = "Aalto", string? title = "Professor")
    {
        await using var context = NewDbContext();

        var user = new ApplicationUser
        {
            UserName = username,
            NormalizedUserName = username.ToUpperInvariant(),
            Email = $"{username}@example.test",
            FirstName = firstName,
            LastName = lastName
        };

        context.Users.Add(user);
        context.Lecturers.Add(Some.Lecturer(user.Id, title: title));

        await context.SaveChangesAsync();

        return user;
    }

    private async Task<T> WithRepository<T>(Func<LecturersRepository, Task<T>> use)
    {
        await using var context = NewDbContext();

        return await use(new LecturersRepository(context));
    }

    [Fact]
    public async Task A_lecturer_is_found_by_the_username_of_the_account_behind_them()
    {
        await StoreLecturer("ana", firstName: "Ana", lastName: "Aalto", title: "Professor");

        var lecturer = await WithRepository(repository =>
            repository.GetLecturerByUsername("ana", CancellationToken.None));

        Assert.Equal("Professor", lecturer.Title);
        Assert.Equal("Ana", lecturer.User.FirstName);
        Assert.Equal("Aalto", lecturer.User.LastName);
    }

    /// <summary>
    /// The user navigation has to be loaded, because everything the API projects a lecturer into
    /// reads the name and the e-mail off it.
    /// </summary>
    [Fact]
    public async Task The_account_behind_a_lecturer_comes_back_with_them()
    {
        await StoreLecturer("ana");

        var lecturer = await WithRepository(repository =>
            repository.GetLecturerByUsername("ana", CancellationToken.None));

        Assert.NotNull(lecturer.User);
        Assert.Equal("ana@example.test", lecturer.User.Email);
    }

    [Fact]
    public async Task A_username_nobody_has_is_reported_as_missing()
    {
        await Assert.ThrowsAsync<LecturerNotFoundException>(() => WithRepository(repository =>
            repository.GetLecturerByUsername("nobody", CancellationToken.None)));
    }

    [Fact]
    public async Task A_user_who_is_not_a_lecturer_is_reported_as_missing_too()
    {
        await using (var context = NewDbContext())
        {
            context.Users.Add(new ApplicationUser { UserName = "student", Email = "student@example.test" });
            await context.SaveChangesAsync();
        }

        await Assert.ThrowsAsync<LecturerNotFoundException>(() => WithRepository(repository =>
            repository.GetLecturerByUsername("student", CancellationToken.None)));
    }

    /// <summary>
    /// Ordered by surname, then given name, then username - so the staff picker in the frontend
    /// does not have to sort, and two people sharing a surname always come out the same way round.
    /// </summary>
    [Fact]
    public async Task The_roster_is_ordered_by_surname_then_given_name()
    {
        await StoreLecturer("zoe", firstName: "Zoe", lastName: "Aalto");
        await StoreLecturer("bob", firstName: "Bob", lastName: "Berg");
        await StoreLecturer("ana", firstName: "Ana", lastName: "Aalto");

        var lecturers = await WithRepository(repository =>
            repository.ListLecturersAsync(CancellationToken.None));

        Assert.Equal(["ana", "zoe", "bob"], lecturers.Select(lecturer => lecturer.User.UserName));
    }

    [Fact]
    public async Task An_empty_roster_is_an_empty_list()
    {
        var lecturers = await WithRepository(repository =>
            repository.ListLecturersAsync(CancellationToken.None));

        Assert.Empty(lecturers);
    }

    [Fact]
    public async Task A_created_lecturer_can_be_read_back()
    {
        await using (var context = NewDbContext())
        {
            var user = new ApplicationUser { UserName = "ana", Email = "ana@example.test" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await new LecturersRepository(context).CreateLecturerAsync(
                Some.Lecturer(user.Id, title: "Docent", department: "Informatics"), CancellationToken.None);
        }

        var lecturer = await WithRepository(repository =>
            repository.GetLecturerByUsername("ana", CancellationToken.None));

        Assert.Equal("Docent", lecturer.Title);
        Assert.Equal("Informatics", lecturer.Department);
    }

    /// <summary>
    /// The lecturer row hangs off the account with a cascade, so removing the account takes the
    /// lecturer with it rather than leaving a row pointing at nobody.
    /// </summary>
    [Fact]
    public async Task Removing_the_account_removes_the_lecturer_with_it()
    {
        var user = await StoreLecturer("ana");

        await using (var context = NewDbContext())
        {
            context.Users.Remove(await context.Users.SingleAsync(u => u.Id == user.Id));
            await context.SaveChangesAsync();
        }

        await using var check = NewDbContext();

        Assert.Empty(await check.Lecturers.ToListAsync());
    }
}
