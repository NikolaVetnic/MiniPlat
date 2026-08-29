using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.UpdateTopicState;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.UnitTests.Application.Subjects;

public class UpdateTopicStateHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();
    private readonly SubjectId _id = SubjectId.Of(Guid.NewGuid());
    private readonly TopicId _topicId = TopicId.Of(Guid.NewGuid());

    private UpdateTopicStateHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private void Stored(Subject? subject) =>
        _subjects.GetById(_id, Arg.Any<CancellationToken>()).Returns(subject!);

    private void StoredWithOneTopic(string lecturer = "ana", string? assistant = null) =>
        Stored(Some.Subject(id: _id, lecturer: lecturer, assistant: assistant,
            topics: [Some.Topic(id: _topicId)]));

    private Task<UpdateTopicStateResult> Update(FakeCurrentUser user, bool? isHidden, bool? isDeleted,
        TopicId? topicId = null) =>
        Handler(user).Handle(
            new UpdateTopicStateCommand(_id, topicId ?? _topicId, isHidden, isDeleted), CancellationToken.None);

    /// <summary>
    /// Checked before anything is read: a request that asks for no change at all is the caller's
    /// mistake, and answering it with a successful no-op hides that.
    /// </summary>
    [Fact]
    public async Task A_request_that_sets_neither_flag_is_rejected_without_touching_the_database()
    {
        await Assert.ThrowsAsync<BadRequestException>(
            () => Update(FakeCurrentUser.Named("ana"), isHidden: null, isDeleted: null));

        await _subjects.DidNotReceive().GetById(Arg.Any<SubjectId>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_subject_that_does_not_exist_is_reported_as_missing()
    {
        Stored(null);

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => Update(FakeCurrentUser.Admin(), isHidden: true, isDeleted: null));
    }

    [Fact]
    public async Task Someone_who_does_not_teach_the_subject_may_not_change_its_topics()
    {
        StoredWithOneTopic(lecturer: "ana");

        await Assert.ThrowsAsync<ForbiddenException>(
            () => Update(FakeCurrentUser.Named("carol"), isHidden: true, isDeleted: null));
    }

    /// <summary>
    /// Ownership is settled before the topic is looked for, so a caller with no business here
    /// cannot learn which topic ids a subject holds by watching 403 turn into 404.
    /// </summary>
    [Fact]
    public async Task Ownership_is_checked_before_the_topic_is_looked_for()
    {
        StoredWithOneTopic(lecturer: "ana");

        await Assert.ThrowsAsync<ForbiddenException>(() => Update(
            FakeCurrentUser.Named("carol"), isHidden: true, isDeleted: null, topicId: TopicId.Of(Guid.NewGuid())));
    }

    [Fact]
    public async Task A_topic_that_belongs_to_another_subject_is_reported_as_missing()
    {
        StoredWithOneTopic(lecturer: "ana");

        await Assert.ThrowsAsync<TopicNotFoundException>(() => Update(
            FakeCurrentUser.Named("ana"), isHidden: true, isDeleted: null, topicId: TopicId.Of(Guid.NewGuid())));
    }

    [Theory]
    [InlineData(true, null)]
    [InlineData(false, null)]
    [InlineData(null, true)]
    [InlineData(null, false)]
    [InlineData(true, true)]
    public async Task The_flags_are_passed_through_exactly_as_they_arrived(bool? isHidden, bool? isDeleted)
    {
        StoredWithOneTopic();

        var result = await Update(FakeCurrentUser.Named("ana"), isHidden, isDeleted);

        Assert.True(result.Updated);
        await _subjects.Received(1).UpdateTopicStateAsync(
            _id, _topicId, isHidden, isDeleted, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task The_assistant_and_an_administrator_may_change_topics_as_well()
    {
        StoredWithOneTopic(lecturer: "ana", assistant: "bob");

        Assert.True((await Update(FakeCurrentUser.Named("bob"), isHidden: true, isDeleted: null)).Updated);
        Assert.True((await Update(FakeCurrentUser.Admin(), isHidden: true, isDeleted: null)).Updated);
    }

    [Fact]
    public async Task A_topic_already_marked_deleted_can_still_be_named()
    {
        Stored(Some.Subject(id: _id, lecturer: "ana", topics: [Some.Topic(id: _topicId, isDeleted: true)]));

        var result = await Update(FakeCurrentUser.Named("ana"), isHidden: null, isDeleted: false);

        Assert.True(result.Updated);
    }
}
