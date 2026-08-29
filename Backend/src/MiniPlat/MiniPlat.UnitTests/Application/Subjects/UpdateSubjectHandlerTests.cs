using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.UnitTests.Application.Subjects;

public class UpdateSubjectHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();
    private readonly SubjectId _id = SubjectId.Of(Guid.NewGuid());

    private UpdateSubjectHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private Subject Stored(string lecturer = "ana", string? assistant = "bob")
    {
        var subject = Some.Subject(id: _id, lecturer: lecturer, assistant: assistant);
        subject.Title = "Original title";
        subject.Version = 5;

        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns(subject);

        return subject;
    }

    /// <summary>A command that asks for no change at all: null everywhere means "leave alone".</summary>
    private UpdateSubjectCommand Command() => new() { Id = _id };

    [Fact]
    public async Task A_subject_that_does_not_exist_is_reported_as_missing()
    {
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns((Subject)null!);

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => Handler(FakeCurrentUser.Admin()).Handle(Command(), CancellationToken.None));
    }

    [Fact]
    public async Task Someone_who_does_not_teach_the_subject_may_not_edit_it()
    {
        Stored(lecturer: "ana");

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Handler(FakeCurrentUser.Named("carol")).Handle(Command(), CancellationToken.None));
    }

    [Fact]
    public async Task Every_field_the_command_carries_is_applied()
    {
        Stored();
        var command = new UpdateSubjectCommand
        {
            Id = _id,
            Title = "New title",
            Code = "MP202",
            Description = "Rewritten.",
            Level = Level.Master,
            Semester = 4,
            Order = 9
        };

        var result = await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        Assert.Equal("New title", result.Subject.Title);
        Assert.Equal("MP202", result.Subject.Code);
        Assert.Equal("Rewritten.", result.Subject.Description);
        Assert.Equal(Level.Master, result.Subject.Level);
        Assert.Equal(4, result.Subject.Semester);
        Assert.Equal(9, result.Subject.Order);
    }

    /// <summary>A null field means "leave this alone", not "clear it".</summary>
    [Fact]
    public async Task A_field_left_null_keeps_the_value_it_had()
    {
        Stored();

        var result = await Handler(FakeCurrentUser.Admin()).Handle(Command(), CancellationToken.None);

        Assert.Equal("Original title", result.Subject.Title);
        Assert.Equal("ana", result.Subject.Lecturer);
        Assert.Equal("bob", result.Subject.Assistant);
    }

    [Fact]
    public async Task Only_an_administrator_may_hand_a_subject_to_a_different_lecturer()
    {
        Stored(lecturer: "ana");
        var command = Command();
        command.Lecturer = "carol";

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Handler(FakeCurrentUser.Named("ana")).Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Only_an_administrator_may_change_the_assistant()
    {
        Stored(lecturer: "ana", assistant: "bob");
        var command = Command();
        command.Assistant = "carol";

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Handler(FakeCurrentUser.Named("ana")).Handle(command, CancellationToken.None));
    }

    /// <summary>
    /// The frontend sends the whole subject back, staff fields included. Resending the names that
    /// are already there is not an attempt to change them.
    /// </summary>
    [Fact]
    public async Task A_lecturer_may_send_the_staff_back_unchanged()
    {
        Stored(lecturer: "ana", assistant: "bob");
        var command = Command();
        command.Lecturer = "ana";
        command.Assistant = "bob";

        var result = await Handler(FakeCurrentUser.Named("ana")).Handle(command, CancellationToken.None);

        Assert.Equal("ana", result.Subject.Lecturer);
    }

    [Fact]
    public async Task An_administrator_may_reassign_the_staff()
    {
        Stored(lecturer: "ana", assistant: "bob");
        var command = Command();
        command.Lecturer = "carol";
        command.Assistant = "dave";

        var result = await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        Assert.Equal("carol", result.Subject.Lecturer);
        Assert.Equal("dave", result.Subject.Assistant);
    }

    /// <summary>
    /// The row was just read, so its own version is current by definition. Overwriting it with the
    /// caller's makes the save compare against what they actually saw.
    /// </summary>
    [Fact]
    public async Task The_version_the_caller_read_is_the_one_the_save_is_checked_against()
    {
        var subject = Stored();
        var command = Command();
        command.Version = 3;

        await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        Assert.Equal(3u, subject.Version);
    }

    /// <summary>
    /// Zero means the caller sent no version at all, so the save goes ahead unchecked rather
    /// than colliding with a row whose version is never zero.
    /// </summary>
    [Fact]
    public async Task A_caller_who_sends_no_version_does_not_overwrite_the_current_one()
    {
        var subject = Stored();
        var command = Command();
        command.Version = 0;

        await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        Assert.Equal(5u, subject.Version);
    }

    [Fact]
    public async Task A_command_with_no_topics_on_it_saves_the_scalar_fields_only()
    {
        Stored();

        await Handler(FakeCurrentUser.Admin()).Handle(Command(), CancellationToken.None);

        await _subjects.Received(1).UpdateAsync(Arg.Any<Subject>(), Arg.Any<CancellationToken>());
        await _subjects.DidNotReceive().ReplaceTopicsAsync(
            Arg.Any<Subject>(), Arg.Any<List<Topic>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_command_carrying_topics_replaces_the_topic_graph()
    {
        var subject = Stored();
        var command = Command();
        command.Topics = [Some.Topic(title: "New topic")];

        await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        await _subjects.Received(1).ReplaceTopicsAsync(subject, command.Topics, Arg.Any<CancellationToken>());
        await _subjects.DidNotReceive().UpdateAsync(Arg.Any<Subject>(), Arg.Any<CancellationToken>());
    }

    /// <summary>An empty list is a subject whose topics were all removed, not an absent list.</summary>
    [Fact]
    public async Task An_empty_topic_list_still_replaces_the_topic_graph()
    {
        Stored();
        var command = Command();
        command.Topics = [];

        await Handler(FakeCurrentUser.Admin()).Handle(command, CancellationToken.None);

        await _subjects.Received(1).ReplaceTopicsAsync(
            Arg.Any<Subject>(), Arg.Any<List<Topic>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Nothing_is_written_when_the_caller_is_turned_away()
    {
        Stored(lecturer: "ana");

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Handler(FakeCurrentUser.Named("carol")).Handle(Command(), CancellationToken.None));

        await _subjects.DidNotReceive().UpdateAsync(Arg.Any<Subject>(), Arg.Any<CancellationToken>());
        await _subjects.DidNotReceive().ReplaceTopicsAsync(
            Arg.Any<Subject>(), Arg.Any<List<Topic>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// A command with nothing on it changes nothing. The fields used to be initialised to empty
    /// strings and an empty topic list, which reached the handler looking exactly like values the
    /// caller had sent: omitting the lecturer cleared the column, and omitting the topics deleted
    /// every one of them.
    /// </summary>
    [Fact]
    public async Task A_command_left_at_its_own_defaults_changes_nothing()
    {
        Stored(lecturer: "ana", assistant: "bob");
        var command = new UpdateSubjectCommand { Id = _id };

        var result = await Handler(FakeCurrentUser.Named("ana")).Handle(command, CancellationToken.None);

        Assert.Equal("Original title", result.Subject.Title);
        Assert.Equal("ana", result.Subject.Lecturer);
        Assert.Equal("bob", result.Subject.Assistant);
        await _subjects.DidNotReceive().ReplaceTopicsAsync(
            Arg.Any<Subject>(), Arg.Any<List<Topic>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// The lecturer check compares against null, so a caller who simply does not mention the
    /// staff is not taken to be reassigning it.
    /// </summary>
    [Fact]
    public async Task A_lecturer_may_edit_without_naming_themselves()
    {
        Stored(lecturer: "ana");
        var command = new UpdateSubjectCommand { Id = _id, Title = "Edited" };

        var result = await Handler(FakeCurrentUser.Named("ana")).Handle(command, CancellationToken.None);

        Assert.Equal("Edited", result.Subject.Title);
        Assert.Equal("ana", result.Subject.Lecturer);
    }

    [Fact]
    public async Task The_assistant_may_edit_the_subject_they_assist_on()
    {
        Stored(lecturer: "ana", assistant: "bob");
        var command = Command();
        command.Title = "Edited by the assistant";

        var result = await Handler(FakeCurrentUser.Named("bob")).Handle(command, CancellationToken.None);

        Assert.Equal("Edited by the assistant", result.Subject.Title);
    }
}
