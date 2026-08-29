using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;

namespace MiniPlat.UnitTests.Application.Subjects;

public class DeleteSubjectHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();

    private DeleteSubjectHandler Handler() => new(_subjects);

    [Fact]
    public async Task The_subject_named_by_the_command_is_the_one_deleted()
    {
        var id = SubjectId.Of(Guid.NewGuid());
        _subjects.GetById(id, Arg.Any<CancellationToken>()).Returns(Some.Subject(id: id));

        var result = await Handler().Handle(new DeleteSubjectCommand(id), CancellationToken.None);

        await _subjects.Received(1).DeleteSubjectAsync(id, Arg.Any<CancellationToken>());
        Assert.True(result.IsSubjectDeleted);
    }

    /// <summary>
    /// The subject is read before it is deleted, so a delete cannot be issued against an id that
    /// no longer names a row.
    /// </summary>
    [Fact]
    public async Task The_subject_is_read_before_it_is_deleted()
    {
        var id = SubjectId.Of(Guid.NewGuid());
        _subjects.GetById(id, Arg.Any<CancellationToken>()).Returns(Some.Subject(id: id));

        await Handler().Handle(new DeleteSubjectCommand(id), CancellationToken.None);

        Received.InOrder(() =>
        {
            _subjects.GetById(id, Arg.Any<CancellationToken>());
            _subjects.DeleteSubjectAsync(id, Arg.Any<CancellationToken>());
        });
    }
}

public class DeleteSubjectCommandValidatorTests
{
    [Fact]
    public void A_command_naming_a_subject_is_valid()
    {
        var result = new DeleteSubjectCommandValidator()
            .Validate(new DeleteSubjectCommand(SubjectId.Of(Guid.NewGuid())));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void A_command_with_no_subject_on_it_is_rejected()
    {
        var result = new DeleteSubjectCommandValidator().Validate(new DeleteSubjectCommand(null!));

        Assert.False(result.IsValid);
    }
}
