using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;
using MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.UnitTests.Application.Lecturers;

public class GetLecturerByUsernameHandlerTests
{
    private readonly ILecturersRepository _lecturers = Substitute.For<ILecturersRepository>();

    private GetLecturerByUsernameHandler Handler() => new(_lecturers);

    [Fact]
    public async Task The_lecturer_is_returned_as_the_handful_of_fields_a_profile_shows()
    {
        _lecturers.GetLecturerByUsername("ana", Arg.Any<CancellationToken>()).Returns(Some.Lecturer(
            username: "ana", title: "Professor", department: "Informatics",
            firstName: "Ana", lastName: "Aalto", email: "ana@example.test"));

        var result = await Handler().Handle(new GetLecturerByUsernameQuery("ana"), CancellationToken.None);

        Assert.Equal(new LecturerDetails("ana", "Professor", "Informatics", "Ana", "Aalto", "ana@example.test"),
            result.Lecturer);
    }

    /// <summary>
    /// The repository is declared as returning a lecturer and throws when there is none, but the
    /// handler does not take that on trust: a null answer is a 404 and not a null reference.
    /// </summary>
    [Fact]
    public async Task A_username_nobody_has_is_reported_as_missing()
    {
        _lecturers.GetLecturerByUsername("nobody", Arg.Any<CancellationToken>()).Returns((Lecturer)null!);

        var exception = await Assert.ThrowsAsync<LecturerNotFoundException>(
            () => Handler().Handle(new GetLecturerByUsernameQuery("nobody"), CancellationToken.None));

        Assert.Contains("nobody", exception.Message);
    }

    [Fact]
    public async Task A_lecturer_with_nothing_filled_in_still_comes_back()
    {
        _lecturers.GetLecturerByUsername("ana", Arg.Any<CancellationToken>()).Returns(Some.Lecturer(
            username: "ana", title: null, department: null, firstName: null, lastName: null, email: null));

        var result = await Handler().Handle(new GetLecturerByUsernameQuery("ana"), CancellationToken.None);

        Assert.Equal("ana", result.Lecturer.Username);
        Assert.Null(result.Lecturer.Title);
    }
}

public class GetLecturerByUsernameQueryValidatorTests
{
    private readonly GetLecturerByUsernameQueryValidator _validator = new();

    [Fact]
    public void A_username_is_required()
    {
        var result = _validator.Validate(new GetLecturerByUsernameQuery(""));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, failure => failure.ErrorMessage == "Username is required.");
    }

    [Fact]
    public void A_username_longer_than_identity_allows_is_rejected()
    {
        var result = _validator.Validate(new GetLecturerByUsernameQuery(new string('a', 257)));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, failure => failure.ErrorMessage == "Username is too long.");
    }

    [Fact]
    public void A_username_of_exactly_the_allowed_length_is_accepted()
    {
        Assert.True(_validator.Validate(new GetLecturerByUsernameQuery(new string('a', 256))).IsValid);
    }
}

public class ListLecturersHandlerTests
{
    private readonly ILecturersRepository _lecturers = Substitute.For<ILecturersRepository>();

    private ListLecturersHandler Handler() => new(_lecturers);

    [Fact]
    public async Task Every_lecturer_is_returned_as_the_four_fields_a_picker_needs()
    {
        _lecturers.ListLecturersAsync(Arg.Any<CancellationToken>()).Returns([
            Some.Lecturer(username: "ana", title: "Professor", firstName: "Ana", lastName: "Aalto"),
            Some.Lecturer(username: "bob", title: "Assistant", firstName: "Bob", lastName: "Berg")
        ]);

        var result = await Handler().Handle(new ListLecturersQuery(), CancellationToken.None);

        Assert.Equal([
            new LecturerSummary("ana", "Professor", "Ana", "Aalto"),
            new LecturerSummary("bob", "Assistant", "Bob", "Berg")
        ], result.Lecturers);
    }

    /// <summary>
    /// The repository orders by surname; the handler projects without sorting, so that order is
    /// what the picker shows.
    /// </summary>
    [Fact]
    public async Task The_order_the_repository_returned_is_kept()
    {
        _lecturers.ListLecturersAsync(Arg.Any<CancellationToken>()).Returns([
            Some.Lecturer(username: "zoe"), Some.Lecturer(username: "ana")
        ]);

        var result = await Handler().Handle(new ListLecturersQuery(), CancellationToken.None);

        Assert.Equal(["zoe", "ana"], result.Lecturers.Select(lecturer => lecturer.Username));
    }

    [Fact]
    public async Task No_lecturers_is_an_empty_list()
    {
        _lecturers.ListLecturersAsync(Arg.Any<CancellationToken>()).Returns([]);

        var result = await Handler().Handle(new ListLecturersQuery(), CancellationToken.None);

        Assert.Empty(result.Lecturers);
    }
}
