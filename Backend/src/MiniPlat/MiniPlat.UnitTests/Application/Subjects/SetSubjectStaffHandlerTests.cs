using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.SetSubjectStaff;
using MiniPlat.Application.Exceptions;
using NSubstitute.ExceptionExtensions;

namespace MiniPlat.UnitTests.Application.Subjects;

public class SetSubjectStaffHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();
    private readonly ILecturersRepository _lecturers = Substitute.For<ILecturersRepository>();
    private readonly SubjectId _id = SubjectId.Of(Guid.NewGuid());

    public SetSubjectStaffHandlerTests()
    {
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns(Some.Subject(id: _id));

        // Anyone not named below does not exist, which is how the real repository answers.
        _lecturers.GetLecturerByUsername(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(callInfo => new LecturerNotFoundException(callInfo.Arg<string>()));

        KnownLecturer("ana");
        KnownLecturer("bob");
    }

    private void KnownLecturer(string username) =>
        _lecturers.GetLecturerByUsername(username, Arg.Any<CancellationToken>())
            .Returns(Some.Lecturer(username: username));

    private SetSubjectStaffHandler Handler() => new(_subjects, _lecturers);

    private Task<SetSubjectStaffResult> SetStaff(string lecturer, string? assistant) =>
        Handler().Handle(new SetSubjectStaffCommand(_id, lecturer, assistant), CancellationToken.None);

    [Fact]
    public async Task Both_names_are_written_when_they_belong_to_real_lecturers()
    {
        var result = await SetStaff("ana", "bob");

        Assert.True(result.Updated);
        await _subjects.Received(1).UpdateStaffAsync(_id, "ana", "bob", Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task A_subject_must_have_a_lecturer(string? lecturer)
    {
        await Assert.ThrowsAsync<BadRequestException>(() => SetStaff(lecturer!, "bob"));

        await _subjects.DidNotReceive().UpdateStaffAsync(
            Arg.Any<SubjectId>(), Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// One representation of "no assistant", so the column never holds an empty string that the
    /// ownership check would then have to treat as a username.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task An_assistant_left_blank_is_stored_as_none(string? assistant)
    {
        await SetStaff("ana", assistant);

        await _subjects.Received(1).UpdateStaffAsync(_id, "ana", null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task The_lecturer_and_the_assistant_have_to_be_different_people()
    {
        await Assert.ThrowsAsync<BadRequestException>(() => SetStaff("ana", "ana"));
    }

    [Fact]
    public async Task A_subject_that_does_not_exist_is_reported_as_missing()
    {
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns((Subject)null!);

        await Assert.ThrowsAsync<SubjectNotFoundException>(() => SetStaff("ana", "bob"));
    }

    /// <summary>
    /// A username nobody has would leave the subject card loading forever, because the lookup
    /// that fills it in answers 404.
    /// </summary>
    [Fact]
    public async Task A_lecturer_username_nobody_has_is_refused_as_a_bad_request()
    {
        var exception = await Assert.ThrowsAsync<BadRequestException>(() => SetStaff("nobody", "bob"));

        Assert.Contains("nobody", exception.Message);
        await _subjects.DidNotReceive().UpdateStaffAsync(
            Arg.Any<SubjectId>(), Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task An_assistant_username_nobody_has_is_refused_as_well()
    {
        var exception = await Assert.ThrowsAsync<BadRequestException>(() => SetStaff("ana", "nobody"));

        Assert.Contains("nobody", exception.Message);
    }

    [Fact]
    public async Task An_absent_assistant_is_not_looked_up_at_all()
    {
        await SetStaff("ana", null);

        await _lecturers.DidNotReceive().GetLecturerByUsername("", Arg.Any<CancellationToken>());
        await _lecturers.Received(1).GetLecturerByUsername("ana", Arg.Any<CancellationToken>());
    }
}
