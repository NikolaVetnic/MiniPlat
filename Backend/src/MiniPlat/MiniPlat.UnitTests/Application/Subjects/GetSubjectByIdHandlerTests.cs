using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Queries.GetSubjectById;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.UnitTests.Application.Subjects;

public class GetSubjectByIdHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();
    private readonly SubjectId _id = SubjectId.Of(Guid.NewGuid());

    private GetSubjectByIdHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private void Stored(Subject? subject) =>
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns(subject!);

    [Fact]
    public async Task A_subject_that_does_not_exist_is_reported_as_missing()
    {
        Stored(null);

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => Handler(FakeCurrentUser.Anonymous()).Handle(new GetSubjectByIdQuery(_id), CancellationToken.None));
    }

    [Fact]
    public async Task A_running_subject_is_returned_to_anyone()
    {
        Stored(Some.Subject(id: _id, isActive: true));

        var result = await Handler(FakeCurrentUser.Anonymous())
            .Handle(new GetSubjectByIdQuery(_id), CancellationToken.None);

        Assert.Equal(_id, result.Subject.Id);
    }

    /// <summary>
    /// Reported as missing rather than forbidden, and by the same rule the listing uses: a
    /// subject filtered out of the catalogue must not be reachable by guessing its id, and a 403
    /// would confirm that the id names something real.
    /// </summary>
    [Fact]
    public async Task A_subject_that_is_not_running_is_missing_as_far_as_a_student_is_concerned()
    {
        Stored(Some.Subject(id: _id, isActive: false, lecturer: "ana"));

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => Handler(FakeCurrentUser.Named("carol")).Handle(new GetSubjectByIdQuery(_id), CancellationToken.None));
    }

    [Fact]
    public async Task The_staff_responsible_can_still_open_a_subject_that_is_not_running()
    {
        Stored(Some.Subject(id: _id, isActive: false, lecturer: "ana", assistant: "bob"));

        var forLecturer = await Handler(FakeCurrentUser.Named("ana"))
            .Handle(new GetSubjectByIdQuery(_id), CancellationToken.None);

        Assert.Equal(_id, forLecturer.Subject.Id);
    }

    [Fact]
    public async Task An_administrator_can_open_a_subject_that_is_not_running()
    {
        Stored(Some.Subject(id: _id, isActive: false, lecturer: "ana"));

        var result = await Handler(FakeCurrentUser.Admin())
            .Handle(new GetSubjectByIdQuery(_id), CancellationToken.None);

        Assert.Equal(_id, result.Subject.Id);
    }

    [Fact]
    public async Task A_student_is_given_the_subject_with_its_hidden_teaching_material_stripped()
    {
        Stored(Some.Subject(id: _id, lecturer: "ana", topics:
        [
            Some.Topic(title: "Visible"),
            Some.Topic(title: "Hidden", isHidden: true)
        ]));

        var result = await Handler(FakeCurrentUser.Anonymous())
            .Handle(new GetSubjectByIdQuery(_id), CancellationToken.None);

        Assert.Equal("Visible", result.Subject.Topics.Single().Title);
    }

    [Fact]
    public async Task The_lecturer_is_given_the_whole_subject()
    {
        Stored(Some.Subject(id: _id, lecturer: "ana", topics:
        [
            Some.Topic(title: "Visible"),
            Some.Topic(title: "Hidden", isHidden: true)
        ]));

        var result = await Handler(FakeCurrentUser.Named("ana"))
            .Handle(new GetSubjectByIdQuery(_id), CancellationToken.None);

        Assert.Equal(2, result.Subject.Topics.Count);
    }
}

public class GetSubjectByIdQueryValidatorTests
{
    [Fact]
    public void A_query_naming_a_subject_is_valid()
    {
        Assert.True(new GetSubjectByIdQueryValidator()
            .Validate(new GetSubjectByIdQuery(SubjectId.Of(Guid.NewGuid()))).IsValid);
    }

    [Fact]
    public void A_query_with_no_subject_on_it_is_rejected()
    {
        Assert.False(new GetSubjectByIdQueryValidator().Validate(new GetSubjectByIdQuery(null!)).IsValid);
    }
}
