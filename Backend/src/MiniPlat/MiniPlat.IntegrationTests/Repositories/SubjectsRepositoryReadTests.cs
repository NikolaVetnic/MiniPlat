using MiniPlat.Application.Entities.Subjects;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.IntegrationTests.Repositories;

public class SubjectsRepositoryReadTests(MiniPlatFixture fixture) : RepositoryTestBase(fixture)
{
    private static SubjectViewer Anonymous => new(null, false);
    private static SubjectViewer Admin => new("carol", true);
    private static SubjectViewer Named(string username) => new(username, false);

    [Fact]
    public async Task A_subject_comes_back_with_the_fields_it_was_stored_with()
    {
        var id = SubjectId.Of(Guid.NewGuid());
        await Store(Some.Subject(id: id, code: "MP101", title: "Mini Platforms", lecturer: "ana",
            assistant: "bob", level: Level.Master, semester: 3, order: 7));

        var subject = await Reload(id);

        Assert.Equal("MP101", subject.Code);
        Assert.Equal("Mini Platforms", subject.Title);
        Assert.Equal("ana", subject.Lecturer);
        Assert.Equal("bob", subject.Assistant);
        Assert.Equal(Level.Master, subject.Level);
        Assert.Equal(3, subject.Semester);
        Assert.Equal(7, subject.Order);
    }

    [Fact]
    public async Task An_id_that_names_nothing_is_reported_as_missing()
    {
        var (repository, context) = NewSubjects();
        await using var _ = context;

        await Assert.ThrowsAsync<SubjectNotFoundException>(
            () => repository.GetById(SubjectId.Of(Guid.NewGuid()), CancellationToken.None));
    }

    /// <summary>
    /// The include carries an OrderBy, so the caller never has to sort what came back - the API
    /// hands the topic list to the frontend exactly as it arrives.
    /// </summary>
    [Fact]
    public async Task Topics_and_their_materials_come_back_in_the_order_they_are_meant_to_be_shown()
    {
        var id = SubjectId.Of(Guid.NewGuid());
        await Store(Some.Subject(id: id, topics:
        [
            Some.Topic(title: "Third", order: 2),
            Some.Topic(title: "First", order: 0, materials:
            [
                Some.Material(description: "Second material", order: 1),
                Some.Material(description: "First material", order: 0)
            ]),
            Some.Topic(title: "Second", order: 1)
        ]));

        var subject = await Reload(id);

        Assert.Equal(["First", "Second", "Third"], subject.Topics.Select(topic => topic.Title));
        Assert.Equal(["First material", "Second material"],
            subject.Topics.First().Materials.Select(material => material.Description));
    }

    [Fact]
    public async Task A_subject_with_no_topics_comes_back_with_an_empty_list_rather_than_null()
    {
        var id = SubjectId.Of(Guid.NewGuid());
        await Store(Some.Subject(id: id));

        Assert.Empty((await Reload(id)).Topics);
    }

    [Fact]
    public async Task The_listing_shows_a_student_only_the_subjects_that_are_running()
    {
        await Store(
            Some.Subject(code: "RUNNING", isActive: true, lecturer: "ana"),
            Some.Subject(code: "OFF", isActive: false, lecturer: "ana"));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListAsync(Anonymous, 0, 10, CancellationToken.None);

        Assert.Equal(["RUNNING"], subjects.Select(subject => subject.Code));
        Assert.Equal(1, total);
    }

    /// <summary>
    /// The count and the page have to agree. Filtering in memory would leave the total counting
    /// subjects the caller never receives, and the frontend would page into nothing.
    /// </summary>
    [Fact]
    public async Task The_total_counts_the_same_rows_the_page_is_taken_from()
    {
        await Store(
            Some.Subject(code: "A", isActive: true, lecturer: "ana"),
            Some.Subject(code: "B", isActive: false, lecturer: "ana"),
            Some.Subject(code: "C", isActive: false, lecturer: "ana"));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (_, anonymousTotal) = await repository.ListAsync(Anonymous, 0, 10, CancellationToken.None);
        var (_, lecturerTotal) = await repository.ListAsync(Named("ana"), 0, 10, CancellationToken.None);

        Assert.Equal(1, anonymousTotal);
        Assert.Equal(3, lecturerTotal);
    }

    [Fact]
    public async Task The_staff_responsible_see_their_own_subject_while_it_is_off()
    {
        await Store(Some.Subject(code: "OFF", isActive: false, lecturer: "ana", assistant: "bob"));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        foreach (var viewer in new[] { Named("ana"), Named("bob"), Admin })
        {
            var (subjects, _) = await repository.ListAsync(viewer, 0, 10, CancellationToken.None);
            Assert.Equal(["OFF"], subjects.Select(subject => subject.Code));
        }
    }

    [Fact]
    public async Task Another_lecturer_does_not_see_a_subject_that_is_off()
    {
        await Store(Some.Subject(code: "OFF", isActive: false, lecturer: "ana"));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListAsync(Named("carol"), 0, 10, CancellationToken.None);

        Assert.Empty(subjects);
        Assert.Equal(0, total);
    }

    [Fact]
    public async Task The_catalogue_is_ordered_by_level_then_semester_then_the_order_column()
    {
        await Store(
            Some.Subject(code: "M-1-1", level: Level.Master, semester: 1, order: 1),
            Some.Subject(code: "U-2-0", level: Level.Undergraduate, semester: 2, order: 0),
            Some.Subject(code: "U-1-1", level: Level.Undergraduate, semester: 1, order: 1),
            Some.Subject(code: "U-1-0", level: Level.Undergraduate, semester: 1, order: 0),
            Some.Subject(code: "M-1-0", level: Level.Master, semester: 1, order: 0));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, _) = await repository.ListAsync(Anonymous, 0, 10, CancellationToken.None);

        Assert.Equal(["U-1-0", "U-1-1", "U-2-0", "M-1-0", "M-1-1"], subjects.Select(subject => subject.Code));
    }

    [Fact]
    public async Task A_page_holds_what_was_asked_for_and_the_total_stays_the_whole_count()
    {
        await Store(Enumerable.Range(0, 5)
            .Select(index => Some.Subject(code: $"S{index}", order: index))
            .ToArray());

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (firstPage, total) = await repository.ListAsync(Anonymous, 0, 2, CancellationToken.None);
        var (secondPage, _) = await repository.ListAsync(Anonymous, 1, 2, CancellationToken.None);
        var (lastPage, _) = await repository.ListAsync(Anonymous, 2, 2, CancellationToken.None);

        Assert.Equal(["S0", "S1"], firstPage.Select(subject => subject.Code));
        Assert.Equal(["S2", "S3"], secondPage.Select(subject => subject.Code));
        Assert.Equal(["S4"], lastPage.Select(subject => subject.Code));
        Assert.Equal(5, total);
    }

    [Fact]
    public async Task A_page_past_the_end_is_empty_and_not_an_error()
    {
        await Store(Some.Subject());

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListAsync(Anonymous, 99, 10, CancellationToken.None);

        Assert.Empty(subjects);
        Assert.Equal(1, total);
    }

    [Fact]
    public async Task The_listing_carries_the_topics_and_materials_with_it()
    {
        await Store(Some.Subject(topics: [Some.Topic(materials: [Some.Material()])]));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, _) = await repository.ListAsync(Anonymous, 0, 10, CancellationToken.None);

        Assert.Single(subjects.Single().Topics);
        Assert.Single(subjects.Single().Topics.Single().Materials);
    }

    [Fact]
    public async Task A_lecturers_own_listing_holds_the_subjects_they_teach_or_assist_on()
    {
        await Store(
            Some.Subject(code: "TEACHES", lecturer: "ana"),
            Some.Subject(code: "ASSISTS", lecturer: "carol", assistant: "ana"),
            Some.Subject(code: "NEITHER", lecturer: "carol", assistant: "bob"));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListByUsernameAsync(
            Named("ana"), "ana", 0, 10, CancellationToken.None);

        Assert.Equal(["ASSISTS", "TEACHES"], subjects.Select(subject => subject.Code).Order());
        Assert.Equal(2, total);
    }

    [Fact]
    public async Task A_lecturers_own_listing_includes_the_subjects_of_theirs_that_are_off()
    {
        await Store(Some.Subject(code: "OFF", lecturer: "ana", isActive: false));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListByUsernameAsync(
            Named("ana"), "ana", 0, 10, CancellationToken.None);

        Assert.Equal(["OFF"], subjects.Select(subject => subject.Code));
        Assert.Equal(1, total);
    }

    /// <summary>
    /// Two filters, and the visibility one still applies: asking for someone else's subjects by
    /// username must not hand over the ones that are off.
    /// </summary>
    [Fact]
    public async Task Asking_for_another_lecturers_subjects_still_hides_the_ones_that_are_off()
    {
        await Store(
            Some.Subject(code: "RUNNING", lecturer: "ana", isActive: true),
            Some.Subject(code: "OFF", lecturer: "ana", isActive: false));

        var (repository, context) = NewSubjects();
        await using var _ = context;

        var (subjects, total) = await repository.ListByUsernameAsync(
            Named("carol"), "ana", 0, 10, CancellationToken.None);

        Assert.Equal(["RUNNING"], subjects.Select(subject => subject.Code));
        Assert.Equal(1, total);
    }
}
