using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.CreateSubject;

namespace MiniPlat.UnitTests.Application.Subjects;

public class CreateSubjectHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();

    private CreateSubjectHandler Handler() => new(_subjects);

    private static CreateSubjectCommand Command() => new()
    {
        Title = "Mini Platforms",
        Code = "MP101",
        Description = "An introduction.",
        Level = Level.Master,
        Semester = 3,
        Order = 7,
        Lecturer = "ana",
        Assistant = "bob"
    };

    [Fact]
    public async Task The_command_is_carried_onto_the_stored_subject()
    {
        Subject? stored = null;
        _subjects.When(repository => repository.CreateAsync(Arg.Any<Subject>(), Arg.Any<CancellationToken>()))
            .Do(call => stored = call.Arg<Subject>());

        await Handler().Handle(Command(), CancellationToken.None);

        Assert.NotNull(stored);
        Assert.Equal("Mini Platforms", stored.Title);
        Assert.Equal("MP101", stored.Code);
        Assert.Equal("An introduction.", stored.Description);
        Assert.Equal(Level.Master, stored.Level);
        Assert.Equal(3, stored.Semester);
        Assert.Equal(7, stored.Order);
        Assert.Equal("ana", stored.Lecturer);
        Assert.Equal("bob", stored.Assistant);
    }

    [Fact]
    public async Task The_id_that_comes_back_is_the_id_of_the_subject_that_was_stored()
    {
        Subject? stored = null;
        _subjects.When(repository => repository.CreateAsync(Arg.Any<Subject>(), Arg.Any<CancellationToken>()))
            .Do(call => stored = call.Arg<Subject>());

        var result = await Handler().Handle(Command(), CancellationToken.None);

        Assert.Equal(stored!.Id, result.SubjectId);
        Assert.NotEqual(Guid.Empty, result.SubjectId.Value);
    }

    [Fact]
    public async Task Each_subject_gets_an_id_of_its_own()
    {
        var handler = Handler();

        var first = await handler.Handle(Command(), CancellationToken.None);
        var second = await handler.Handle(Command(), CancellationToken.None);

        Assert.NotEqual(first.SubjectId, second.SubjectId);
    }

    [Fact]
    public async Task The_cancellation_token_is_handed_on_to_the_repository()
    {
        using var cancellation = new CancellationTokenSource();

        await Handler().Handle(Command(), cancellation.Token);

        await _subjects.Received(1).CreateAsync(Arg.Any<Subject>(), cancellation.Token);
    }
}
