using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.ReorderTopics;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.UnitTests.Application.Subjects;

public class ReorderTopicsHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();
    private readonly SubjectId _id = SubjectId.Of(Guid.NewGuid());
    private readonly TopicId _first = TopicId.Of(Guid.NewGuid());
    private readonly TopicId _second = TopicId.Of(Guid.NewGuid());
    private readonly TopicId _third = TopicId.Of(Guid.NewGuid());

    private ReorderTopicsHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private void Stored(Subject? subject) =>
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns(subject!);

    private void StoredWithThreeTopics(string lecturer = "ana", string? assistant = null) =>
        Stored(Some.Subject(id: _id, lecturer: lecturer, assistant: assistant, topics:
        [
            Some.Topic(id: _first, order: 0),
            Some.Topic(id: _second, order: 1),
            Some.Topic(id: _third, order: 2)
        ]));

    private Task<ReorderTopicsResult> Reorder(FakeCurrentUser user, params TopicId[] order) =>
        Handler(user).Handle(new ReorderTopicsCommand(_id, order), CancellationToken.None);

    [Fact]
    public async Task A_subject_that_does_not_exist_is_reported_as_missing()
    {
        Stored(null);

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => Reorder(FakeCurrentUser.Admin(), _first));
    }

    [Fact]
    public async Task Someone_who_does_not_teach_the_subject_may_not_reorder_it()
    {
        StoredWithThreeTopics(lecturer: "ana");

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Reorder(FakeCurrentUser.Named("carol"), _third, _second, _first));

        await _subjects.DidNotReceive().ReorderTopicsAsync(
            Arg.Any<SubjectId>(), Arg.Any<IReadOnlyList<TopicId>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task An_anonymous_caller_may_not_reorder_topics()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Reorder(FakeCurrentUser.Anonymous(), _third, _second, _first));
    }

    [Fact]
    public async Task The_lecturer_the_assistant_and_an_administrator_may_all_reorder()
    {
        StoredWithThreeTopics(lecturer: "ana", assistant: "bob");

        foreach (var user in new[] { FakeCurrentUser.Named("ana"), FakeCurrentUser.Named("bob"), FakeCurrentUser.Admin() })
            Assert.True((await Reorder(user, _third, _second, _first)).Reordered);
    }

    [Fact]
    public async Task The_new_order_is_handed_to_the_repository_as_it_was_given()
    {
        StoredWithThreeTopics();

        await Reorder(FakeCurrentUser.Named("ana"), _third, _first, _second);

        await _subjects.Received(1).ReorderTopicsAsync(
            _id,
            Arg.Is<IReadOnlyList<TopicId>>(order => order.SequenceEqual(new[] { _third, _first, _second })),
            Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// The list has to name every topic exactly once. Anything else would leave some topics
    /// holding an order that no longer means anything next to the ones that moved.
    /// </summary>
    [Fact]
    public async Task An_order_that_names_a_topic_twice_is_rejected()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<BadRequestException>(
            () => Reorder(FakeCurrentUser.Named("ana"), _first, _second, _second));
    }

    [Fact]
    public async Task An_order_that_leaves_a_topic_out_is_rejected()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<BadRequestException>(
            () => Reorder(FakeCurrentUser.Named("ana"), _first, _second));
    }

    [Fact]
    public async Task An_order_naming_a_topic_from_another_subject_is_rejected()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<BadRequestException>(
            () => Reorder(FakeCurrentUser.Named("ana"), _first, _second, _third, TopicId.Of(Guid.NewGuid())));
    }

    [Fact]
    public async Task An_empty_order_against_a_subject_that_has_topics_is_rejected()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<BadRequestException>(() => Reorder(FakeCurrentUser.Named("ana")));
    }

    [Fact]
    public async Task Nothing_is_written_when_the_order_is_rejected()
    {
        StoredWithThreeTopics();

        await Assert.ThrowsAsync<BadRequestException>(
            () => Reorder(FakeCurrentUser.Named("ana"), _first, _second));

        await _subjects.DidNotReceive().ReorderTopicsAsync(
            Arg.Any<SubjectId>(), Arg.Any<IReadOnlyList<TopicId>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Topic ids are compared through hash sets, and two instances over the same guid are the
    /// same topic - so an order rebuilt from the ids the client sent back still matches.
    /// </summary>
    [Fact]
    public async Task Ids_are_matched_by_value_and_not_by_instance()
    {
        StoredWithThreeTopics();

        var result = await Reorder(FakeCurrentUser.Named("ana"),
            TopicId.Of(_third.Value), TopicId.Of(_second.Value), TopicId.Of(_first.Value));

        Assert.True(result.Reordered);
    }
}
