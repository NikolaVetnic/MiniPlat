using BuildingBlocks.Application.Exceptions;
using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.IntegrationTests.Repositories;

public class SubjectsRepositoryWriteTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    [Fact]
    public async Task A_created_subject_can_be_read_back()
    {
        var subject = Some.Subject(code: "NEW-001");

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.CreateAsync(subject, CancellationToken.None);

        Assert.Equal("NEW-001", (await Reload(subject.Id)).Code);
    }

    [Fact]
    public async Task A_created_subject_is_stamped_with_who_created_it_and_when()
    {
        var subject = Some.Subject();

        var (repository, context) = NewSubjects(new TestCurrentUser("ana"));
        await using (context)
            await repository.CreateAsync(subject, CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.Equal("ana", stored.CreatedBy);
        Assert.Equal("ana", stored.LastModifiedBy);
        Assert.NotNull(stored.CreatedAt);
    }

    /// <summary>
    /// Seeding and migrations run outside any request, so there is genuinely nobody to record.
    /// "system" says that rather than leaving the column empty or blaming a person for it.
    /// </summary>
    [Fact]
    public async Task A_change_made_outside_a_request_is_recorded_against_system()
    {
        var subject = Some.Subject();

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.CreateAsync(subject, CancellationToken.None);

        Assert.Equal("system", (await Reload(subject.Id)).CreatedBy);
    }

    [Fact]
    public async Task An_update_writes_the_scalar_fields_and_records_who_made_it()
    {
        var subject = Some.Subject(title: "Original");
        await Store(subject);

        var stored = await Reload(subject.Id);
        stored.Title = "Rewritten";

        var (repository, context) = NewSubjects(new TestCurrentUser("bob"));
        await using (context)
            await repository.UpdateAsync(stored, CancellationToken.None);

        var reloaded = await Reload(subject.Id);

        Assert.Equal("Rewritten", reloaded.Title);
        Assert.Equal("bob", reloaded.LastModifiedBy);
    }

    [Fact]
    public async Task Setting_the_staff_writes_both_names()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateStaffAsync(subject.Id, "carol", "dave", CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.Equal("carol", stored.Lecturer);
        Assert.Equal("dave", stored.Assistant);
    }

    [Fact]
    public async Task A_subject_can_be_left_without_an_assistant()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateStaffAsync(subject.Id, "ana", null, CancellationToken.None);

        Assert.Null((await Reload(subject.Id)).Assistant);
    }

    /// <summary>
    /// Changing a name must not disturb the teaching material, which is the reason this is its
    /// own tracked update rather than a trip through the topic replacement.
    /// </summary>
    [Fact]
    public async Task Setting_the_staff_leaves_the_topics_where_they_are()
    {
        var subject = Some.Subject(topics: [Some.Topic(materials: [Some.Material()])]);
        await Store(subject);

        var topicId = subject.Topics.Single().Id;

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateStaffAsync(subject.Id, "carol", null, CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.Equal(topicId, stored.Topics.Single().Id);
        Assert.Single(stored.Topics.Single().Materials);
    }

    [Fact]
    public async Task Staff_cannot_be_set_on_a_subject_that_does_not_exist()
    {
        var (repository, context) = NewSubjects();
        await using var _ = context;

        await Assert.ThrowsAsync<SubjectNotFoundException>(() => repository.UpdateStaffAsync(
            SubjectId.Of(Guid.NewGuid()), "ana", null, CancellationToken.None));
    }

    [Fact]
    public async Task Reordering_writes_the_new_position_of_each_topic()
    {
        var first = TopicId.Of(Guid.NewGuid());
        var second = TopicId.Of(Guid.NewGuid());
        var third = TopicId.Of(Guid.NewGuid());

        var subject = Some.Subject(topics:
        [
            Some.Topic(id: first, title: "First", order: 0),
            Some.Topic(id: second, title: "Second", order: 1),
            Some.Topic(id: third, title: "Third", order: 2)
        ]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.ReorderTopicsAsync(subject.Id, [third, first, second], CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.Equal(["Third", "First", "Second"], stored.Topics.Select(topic => topic.Title));
        Assert.Equal([0, 1, 2], stored.Topics.Select(topic => topic.Order));
    }

    /// <summary>
    /// Only the Order column moves. The topics keep their identity, so nothing downstream that
    /// holds a topic id has to be told about a reorder.
    /// </summary>
    [Fact]
    public async Task Reordering_keeps_the_topics_and_their_materials_intact()
    {
        var first = TopicId.Of(Guid.NewGuid());
        var second = TopicId.Of(Guid.NewGuid());

        var subject = Some.Subject(topics:
        [
            Some.Topic(id: first, order: 0, materials: [Some.Material(description: "Kept")]),
            Some.Topic(id: second, order: 1)
        ]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.ReorderTopicsAsync(subject.Id, [second, first], CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.Equal([second, first], stored.Topics.Select(topic => topic.Id));
        Assert.Equal("Kept", stored.Topics.Last().Materials.Single().Description);
    }

    [Fact]
    public async Task Topics_cannot_be_reordered_on_a_subject_that_does_not_exist()
    {
        var (repository, context) = NewSubjects();
        await using var _ = context;

        await Assert.ThrowsAsync<SubjectNotFoundException>(() => repository.ReorderTopicsAsync(
            SubjectId.Of(Guid.NewGuid()), [TopicId.Of(Guid.NewGuid())], CancellationToken.None));
    }

    [Fact]
    public async Task Hiding_a_topic_writes_the_flag_and_leaves_the_deletion_alone()
    {
        var subject = Some.Subject(topics: [Some.Topic()]);
        await Store(subject);

        var topicId = subject.Topics.Single().Id;

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateTopicStateAsync(subject.Id, topicId, true, null, CancellationToken.None);

        var topic = (await Reload(subject.Id)).Topics.Single();

        Assert.True(topic.IsHidden);
        Assert.False(topic.IsDeleted);
        Assert.Null(topic.DeletedAt);
    }

    /// <summary>
    /// The retention period starts when the topic is deleted, so that is when the clock is
    /// stamped - separately from LastModifiedAt, which any later save would move.
    /// </summary>
    [Fact]
    public async Task Deleting_a_topic_starts_its_retention_clock()
    {
        var subject = Some.Subject(topics: [Some.Topic()]);
        await Store(subject);

        var before = DateTime.UtcNow;

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateTopicStateAsync(
                subject.Id, subject.Topics.Single().Id, null, true, CancellationToken.None);

        var topic = (await Reload(subject.Id)).Topics.Single();

        Assert.True(topic.IsDeleted);
        Assert.NotNull(topic.DeletedAt);
        Assert.InRange(topic.DeletedAt.Value, before.AddSeconds(-5), DateTime.UtcNow.AddSeconds(5));
    }

    /// <summary>
    /// Deleting an already deleted topic must not push its deadline out, or a topic could be kept
    /// alive indefinitely by repeating the request.
    /// </summary>
    [Fact]
    public async Task Deleting_a_topic_that_is_already_deleted_leaves_the_clock_where_it_was()
    {
        var deletedAt = DateTime.UtcNow.AddDays(-3);
        var subject = Some.Subject(topics: [Some.Topic(isDeleted: true, deletedAt: deletedAt)]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateTopicStateAsync(
                subject.Id, subject.Topics.Single().Id, null, true, CancellationToken.None);

        var stored = (await Reload(subject.Id)).Topics.Single();

        Assert.Equal(deletedAt, stored.DeletedAt!.Value, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task Restoring_a_topic_clears_its_retention_clock()
    {
        var subject = Some.Subject(topics:
            [Some.Topic(isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-1))]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateTopicStateAsync(
                subject.Id, subject.Topics.Single().Id, null, false, CancellationToken.None);

        var topic = (await Reload(subject.Id)).Topics.Single();

        Assert.False(topic.IsDeleted);
        Assert.Null(topic.DeletedAt);
    }

    [Fact]
    public async Task Both_flags_can_be_written_at_once()
    {
        var subject = Some.Subject(topics: [Some.Topic()]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateTopicStateAsync(
                subject.Id, subject.Topics.Single().Id, true, true, CancellationToken.None);

        var topic = (await Reload(subject.Id)).Topics.Single();

        Assert.True(topic.IsHidden);
        Assert.True(topic.IsDeleted);
    }

    [Fact]
    public async Task A_topic_that_belongs_to_another_subject_is_reported_as_missing()
    {
        var subject = Some.Subject(topics: [Some.Topic()]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using var _ = context;

        await Assert.ThrowsAsync<TopicNotFoundException>(() => repository.UpdateTopicStateAsync(
            subject.Id, TopicId.Of(Guid.NewGuid()), true, null, CancellationToken.None));
    }

    [Fact]
    public async Task Deleting_a_subject_takes_its_topics_and_materials_with_it()
    {
        var subject = Some.Subject(topics: [Some.Topic(materials: [Some.Material()])]);
        await Store(subject);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.DeleteSubjectAsync(subject.Id, CancellationToken.None);

        await using var check = NewDbContext();

        Assert.Empty(await check.Subjects.ToListAsync());
        Assert.Empty(await check.Topics.ToListAsync());
        Assert.Empty(await check.Materials.ToListAsync());
    }

    [Fact]
    public async Task Deleting_a_subject_leaves_the_others_alone()
    {
        var doomed = Some.Subject(code: "GONE");
        var kept = Some.Subject(code: "KEPT", topics: [Some.Topic()]);
        await Store(doomed, kept);

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.DeleteSubjectAsync(doomed.Id, CancellationToken.None);

        Assert.Equal("KEPT", (await Reload(kept.Id)).Code);
    }
}

public class SubjectConcurrencyTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    /// <summary>
    /// The version is the row's own xmin, which Postgres moves on every update. It is not a
    /// column anyone writes, so a freshly read subject always carries a usable one.
    /// </summary>
    [Fact]
    public async Task A_stored_subject_carries_a_version()
    {
        var subject = Some.Subject();
        await Store(subject);

        Assert.NotEqual(0u, (await Reload(subject.Id)).Version);
    }

    /// <summary>
    /// Postgres moves xmin on every update, and EF reads the new one back onto the entity - so a
    /// caller who saves twice in a row does not collide with themselves.
    /// </summary>
    [Fact]
    public async Task Saving_a_subject_moves_its_version_on_and_refreshes_the_one_in_hand()
    {
        var subject = Some.Subject(title: "Original");
        await Store(subject);

        var first = await Reload(subject.Id);
        var versionRead = first.Version;
        first.Title = "Changed";

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateAsync(first, CancellationToken.None);

        var stored = await Reload(subject.Id);

        Assert.NotEqual(versionRead, stored.Version);
        Assert.Equal(stored.Version, first.Version);
    }

    /// <summary>
    /// Two lecturers open the same subject; the second one to save is told rather than quietly
    /// overwriting the first. This is the whole point of carrying the version to the client and
    /// back, and nothing below the database can demonstrate that it works.
    /// </summary>
    [Fact]
    public async Task A_save_built_on_a_version_someone_else_has_already_moved_is_refused()
    {
        var subject = Some.Subject(title: "Original");
        await Store(subject);

        var mine = await Reload(subject.Id);
        var theirs = await Reload(subject.Id);

        theirs.Title = "Saved first";
        var (theirRepository, theirContext) = NewSubjects();
        await using (theirContext)
            await theirRepository.UpdateAsync(theirs, CancellationToken.None);

        mine.Title = "Saved second";
        var (myRepository, myContext) = NewSubjects();
        await using (myContext)
            await Assert.ThrowsAsync<ConcurrencyException>(
                () => myRepository.UpdateAsync(mine, CancellationToken.None));

        Assert.Equal("Saved first", (await Reload(subject.Id)).Title);
    }

    [Fact]
    public async Task The_conflict_is_reported_in_terms_the_caller_can_act_on()
    {
        var subject = Some.Subject();
        await Store(subject);

        var mine = await Reload(subject.Id);
        var theirs = await Reload(subject.Id);

        theirs.Title = "First";
        var (theirRepository, theirContext) = NewSubjects();
        await using (theirContext)
            await theirRepository.UpdateAsync(theirs, CancellationToken.None);

        mine.Title = "Second";
        var (myRepository, myContext) = NewSubjects();
        await using (myContext)
        {
            var exception = await Assert.ThrowsAsync<ConcurrencyException>(
                () => myRepository.UpdateAsync(mine, CancellationToken.None));

            Assert.Contains("changed by someone else", exception.Message);
        }
    }

    [Fact]
    public async Task Saving_on_the_current_version_goes_through()
    {
        var subject = Some.Subject(title: "Original");
        await Store(subject);

        var stored = await Reload(subject.Id);
        stored.Title = "Changed";

        var (repository, context) = NewSubjects();
        await using (context)
            await repository.UpdateAsync(stored, CancellationToken.None);

        Assert.Equal("Changed", (await Reload(subject.Id)).Title);
    }
}
