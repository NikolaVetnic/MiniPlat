using Microsoft.EntityFrameworkCore;

namespace MiniPlat.IntegrationTests.Repositories;

/// <summary>
/// ReplaceTopicsAsync takes the whole topic and material graph the client sent and makes the
/// stored one match it. Everything here is about what survives that and what does not.
/// </summary>
public class SubjectsRepositoryTopicGraphTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    private async Task Replace(Subject existing, List<Topic> newTopics)
    {
        var (repository, context) = NewSubjects();
        await using (context)
            await repository.ReplaceTopicsAsync(existing, newTopics, CancellationToken.None);
    }

    [Fact]
    public async Task A_topic_that_is_not_in_the_new_list_is_gone()
    {
        var subject = Some.Subject(topics: [Some.Topic(title: "Dropped"), Some.Topic(title: "Kept")]);
        await Store(subject);

        var existing = await Reload(subject.Id);
        var kept = existing.Topics.Single(topic => topic.Title == "Kept");

        await Replace(existing, [Some.Topic(id: kept.Id, title: "Kept")]);

        var stored = await Reload(subject.Id);

        Assert.Equal(["Kept"], stored.Topics.Select(topic => topic.Title));
    }

    [Fact]
    public async Task A_topic_resent_with_the_id_it_already_had_keeps_that_id()
    {
        var topicId = TopicId.Of(Guid.NewGuid());
        var subject = Some.Subject(topics: [Some.Topic(id: topicId, title: "Before")]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing, [Some.Topic(id: topicId, title: "After")]);

        var stored = await Reload(subject.Id);

        Assert.Equal(topicId, stored.Topics.Single().Id);
        Assert.Equal("After", stored.Topics.Single().Title);
    }

    [Fact]
    public async Task A_topic_the_subject_never_had_is_added()
    {
        var subject = Some.Subject(topics: [Some.Topic(title: "Old")]);
        await Store(subject);

        var existing = await Reload(subject.Id);
        var old = existing.Topics.Single();

        await Replace(existing,
        [
            Some.Topic(id: old.Id, title: "Old"),
            Some.Topic(title: "Brand new")
        ]);

        var stored = await Reload(subject.Id);

        Assert.Equal(["Old", "Brand new"], stored.Topics.Select(topic => topic.Title));
    }

    /// <summary>
    /// The position in the list is the order, whatever Order the client happened to put on each
    /// topic - so dragging a topic up is expressed by moving it in the list and nothing else.
    /// </summary>
    [Fact]
    public async Task The_order_is_taken_from_the_position_in_the_list_and_not_from_the_payload()
    {
        var subject = Some.Subject();
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing,
        [
            Some.Topic(title: "First", order: 99),
            Some.Topic(title: "Second", order: 5),
            Some.Topic(title: "Third", order: 42)
        ]);

        var stored = await Reload(subject.Id);

        Assert.Equal(["First", "Second", "Third"], stored.Topics.Select(topic => topic.Title));
        Assert.Equal([0, 1, 2], stored.Topics.Select(topic => topic.Order));
    }

    [Fact]
    public async Task The_materials_of_each_topic_are_replaced_along_with_it()
    {
        var subject = Some.Subject(topics:
            [Some.Topic(materials: [Some.Material(description: "Dropped")])]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing,
        [
            Some.Topic(id: existing.Topics.Single().Id, materials:
            [
                Some.Material(description: "First", order: 0),
                Some.Material(description: "Second", order: 1)
            ])
        ]);

        var stored = await Reload(subject.Id);

        Assert.Equal(["First", "Second"],
            stored.Topics.Single().Materials.Select(material => material.Description));
    }

    [Fact]
    public async Task No_material_of_a_removed_topic_is_left_behind()
    {
        var subject = Some.Subject(topics:
            [Some.Topic(title: "Dropped", materials: [Some.Material(), Some.Material()])]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing, []);

        await using var context = NewDbContext();

        Assert.Empty(await context.Topics.ToListAsync());
        Assert.Empty(await context.Materials.ToListAsync());
    }

    /// <summary>
    /// The retention clock is kept across a save. Every save rebuilds the topic rows, so reading
    /// it off the new payload would restart the countdown each time the lecturer edits anything.
    /// </summary>
    [Fact]
    public async Task A_topic_that_was_already_deleted_keeps_the_deadline_it_had()
    {
        var topicId = TopicId.Of(Guid.NewGuid());
        var deletedAt = DateTime.UtcNow.AddDays(-3);

        var subject = Some.Subject(topics: [Some.Topic(id: topicId, isDeleted: true, deletedAt: deletedAt)]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing, [Some.Topic(id: topicId, isDeleted: true)]);

        var stored = await Reload(subject.Id);

        Assert.Equal(deletedAt, stored.Topics.Single().DeletedAt!.Value, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task A_topic_deleted_by_this_save_has_its_deadline_stamped_now()
    {
        var topicId = TopicId.Of(Guid.NewGuid());
        var subject = Some.Subject(topics: [Some.Topic(id: topicId)]);
        await Store(subject);

        var existing = await Reload(subject.Id);
        var before = DateTime.UtcNow;

        await Replace(existing, [Some.Topic(id: topicId, isDeleted: true)]);

        var stored = await Reload(subject.Id);

        Assert.NotNull(stored.Topics.Single().DeletedAt);
        Assert.InRange(stored.Topics.Single().DeletedAt!.Value,
            before.AddSeconds(-5), DateTime.UtcNow.AddSeconds(5));
    }

    [Fact]
    public async Task A_topic_that_is_no_longer_deleted_has_its_deadline_cleared()
    {
        var topicId = TopicId.Of(Guid.NewGuid());
        var subject = Some.Subject(topics:
            [Some.Topic(id: topicId, isDeleted: true, deletedAt: DateTime.UtcNow.AddDays(-1))]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing, [Some.Topic(id: topicId, isDeleted: false)]);

        var stored = await Reload(subject.Id);

        Assert.False(stored.Topics.Single().IsDeleted);
        Assert.Null(stored.Topics.Single().DeletedAt);
    }

    [Fact]
    public async Task The_hidden_flag_survives_the_replacement()
    {
        var topicId = TopicId.Of(Guid.NewGuid());
        var subject = Some.Subject(topics: [Some.Topic(id: topicId)]);
        await Store(subject);

        var existing = await Reload(subject.Id);

        await Replace(existing, [Some.Topic(id: topicId, isHidden: true)]);

        Assert.True((await Reload(subject.Id)).Topics.Single().IsHidden);
    }

    [Fact]
    public async Task The_subjects_own_fields_are_saved_along_with_the_topics()
    {
        var subject = Some.Subject(title: "Original");
        await Store(subject);

        var existing = await Reload(subject.Id);
        existing.Title = "Rewritten";

        await Replace(existing, [Some.Topic()]);

        Assert.Equal("Rewritten", (await Reload(subject.Id)).Title);
    }

    [Fact]
    public async Task Replacing_the_topics_of_one_subject_leaves_another_alone()
    {
        var mine = Some.Subject(code: "MINE", topics: [Some.Topic(title: "Mine")]);
        var theirs = Some.Subject(code: "THEIRS", topics: [Some.Topic(title: "Theirs")]);
        await Store(mine, theirs);

        await Replace(await Reload(mine.Id), []);

        Assert.Equal(["Theirs"], (await Reload(theirs.Id)).Topics.Select(topic => topic.Title));
    }
}
