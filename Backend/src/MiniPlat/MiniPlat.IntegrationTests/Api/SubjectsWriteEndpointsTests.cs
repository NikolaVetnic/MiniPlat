using System.Net;

namespace MiniPlat.IntegrationTests.Api;

/// <summary>
/// Each test gets a subject of its own, taught by the seeded lecturer, and it is removed
/// afterwards - so the seeded catalogue the read tests assert on is never disturbed.
/// </summary>
public class SubjectsWriteEndpointsTests(MiniPlatFixture fixture) : ApiTestBase(fixture), Xunit.IAsyncLifetime
{
    private string _subjectId = null!;

    public async Task InitializeAsync() =>
        _subjectId = await CreateSubject($"TST-{Guid.NewGuid():N}"[..10]);

    public async Task DisposeAsync()
    {
        var admin = await AsAdmin();

        // The subject is gone already if the test was about deleting it.
        await admin.DeleteAsync($"/api/Subjects/{_subjectId}");
    }

    private async Task<SubjectWire> Mine(HttpClient? client = null) =>
        await GetSubject(_subjectId, client ?? await AsAdmin());

    private async Task<HttpResponseMessage> Update(HttpClient client, object body) =>
        await client.PutJson($"/api/Subjects/{_subjectId}", body);

    private async Task<SubjectWire> GiveItTopics(params string[] titles)
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, UpdateBody(subject,
            topics: titles.Select(title => NewTopic(title)).ToArray()));

        response.EnsureSuccessStatusCode();

        return await Mine(admin);
    }

    #region Creating

    [Fact]
    public async Task Creating_a_subject_is_closed_to_anyone_without_a_token()
    {
        var response = await Anonymous.PostJson("/api/Subjects", new { title = "x", code = "x" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_lecturer_may_not_create_a_subject()
    {
        var client = await AsLecturer();

        var response = await client.PostJson("/api/Subjects", new { title = "x", code = "x" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task An_administrator_creates_a_subject_that_can_then_be_read_back()
    {
        var subject = await Mine();

        Assert.Equal(Lecturer, subject.Lecturer);
        Assert.True(subject.IsActive);
        Assert.Empty(subject.Topics);
    }

    #endregion

    #region Editing

    [Fact]
    public async Task Editing_is_closed_to_anyone_without_a_token()
    {
        var subject = await Mine();

        var response = await Update(Anonymous, UpdateBody(subject, title: "Nope"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task The_lecturer_of_the_subject_may_edit_it()
    {
        var client = await AsLecturer();
        var subject = await Mine(client);

        var response = await Update(client, UpdateBody(subject, title: "Retitled by its lecturer"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Retitled by its lecturer", (await Mine()).Title);
    }

    [Fact]
    public async Task A_lecturer_who_teaches_something_else_may_not()
    {
        var subject = await Mine();
        var client = await AsOtherLecturer();

        var response = await Update(client, UpdateBody(subject, title: "Not yours"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("ForbiddenException", (await response.ReadProblem()).Title);
    }

    [Fact]
    public async Task Only_an_administrator_may_hand_the_subject_to_a_different_lecturer()
    {
        var client = await AsLecturer();
        var subject = await Mine(client);

        var response = await Update(client, UpdateBody(subject, lecturer: OtherLecturer));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task An_administrator_may_hand_it_over()
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, UpdateBody(subject, lecturer: OtherLecturer));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(OtherLecturer, (await Mine()).Lecturer);
    }

    /// <summary>
    /// An update names only what it changes. Both request and command used to initialise their
    /// fields, so a body that left the lecturer out arrived as an empty string and cleared the
    /// column - and one that left the topics out arrived as an empty list and deleted them all.
    /// </summary>
    [Fact]
    public async Task An_update_that_omits_the_lecturer_leaves_it_alone()
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, new { title = "Retitled", version = subject.Version });

        response.EnsureSuccessStatusCode();

        var updated = await Mine();

        Assert.Equal("Retitled", updated.Title);
        Assert.Equal(Lecturer, updated.Lecturer);
        Assert.Equal(subject.Code, updated.Code);
    }

    /// <summary>An empty list is still a list: it says to remove every topic.</summary>
    [Fact]
    public async Task An_update_carrying_an_empty_topic_list_removes_them_all()
    {
        await GiveItTopics("First", "Second");

        var admin = await AsAdmin();
        var subject = await Mine(admin);

        (await Update(admin, UpdateBody(subject, topics: Array.Empty<object>())))
            .EnsureSuccessStatusCode();

        Assert.Empty((await Mine()).Topics);
    }

    [Fact]
    public async Task An_update_that_omits_the_topics_leaves_them_alone()
    {
        await GiveItTopics("First", "Second");

        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, new
        {
            title = "Retitled",
            code = subject.Code,
            description = subject.Description,
            level = subject.Level,
            semester = subject.Semester,
            lecturer = subject.Lecturer,
            assistant = subject.Assistant,
            version = subject.Version
        });

        response.EnsureSuccessStatusCode();

        Assert.Equal(["First", "Second"], (await Mine()).Topics.Select(topic => topic.Title));
    }

    #endregion

    #region Topics

    [Fact]
    public async Task Topics_sent_with_an_update_become_the_subjects_topics()
    {
        var subject = await GiveItTopics("First", "Second");

        Assert.Equal(["First", "Second"], subject.Topics.Select(topic => topic.Title));
        Assert.Equal([0, 1], subject.Topics.Select(topic => topic.Order));
    }

    /// <summary>
    /// A new topic has to arrive with an id of its own. The id type refuses the all-zero guid, so
    /// a client that sends one, or none, cannot be given a topic row.
    /// </summary>
    [Fact]
    public async Task A_topic_without_a_usable_id_is_refused()
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, UpdateBody(subject, topics: new object[]
        {
            new { id = Guid.Empty.ToString(), title = "No id", description = "x", order = 0, materials = Array.Empty<object>() }
        }));

        Assert.False(response.IsSuccessStatusCode);
    }

    /// <summary>
    /// A lecturer could otherwise store a script URL, which the browser would run in a student's
    /// session the moment the link is clicked.
    /// </summary>
    [Fact]
    public async Task A_material_linking_to_something_other_than_the_web_is_refused()
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        var response = await Update(admin, UpdateBody(subject, topics: new[]
        {
            NewTopic("With a bad link", materials:
            [
                new { id = Guid.NewGuid().ToString(), description = "Trap", link = "javascript:alert(1)", order = 0 }
            ])
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("ValidationException", (await response.ReadProblem()).Title);
    }

    [Fact]
    public async Task A_hidden_topic_is_not_in_what_a_student_receives()
    {
        var admin = await AsAdmin();
        var subject = await Mine(admin);

        (await Update(admin, UpdateBody(subject, topics: new[]
        {
            NewTopic("Visible"),
            NewTopic("Hidden", isHidden: true)
        }))).EnsureSuccessStatusCode();

        Assert.Equal(["Visible"], (await GetSubject(_subjectId)).Topics.Select(topic => topic.Title));
        Assert.Equal(2, (await Mine()).Topics.Count);
    }

    [Fact]
    public async Task The_lecturer_may_hide_a_topic()
    {
        var subject = await GiveItTopics("First");
        var client = await AsLecturer();

        var response = await client.PatchJson(
            $"/api/Subjects/{_subjectId}/topics/{subject.Topics.Single().Id}", new { isHidden = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True((await Mine()).Topics.Single().IsHidden);
    }

    [Fact]
    public async Task A_lecturer_who_teaches_something_else_may_not_touch_the_topics()
    {
        var subject = await GiveItTopics("First");
        var client = await AsOtherLecturer();

        var response = await client.PatchJson(
            $"/api/Subjects/{_subjectId}/topics/{subject.Topics.Single().Id}", new { isHidden = true });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task A_request_that_sets_neither_flag_is_refused()
    {
        var subject = await GiveItTopics("First");
        var client = await AsLecturer();

        var response = await client.PatchJson(
            $"/api/Subjects/{_subjectId}/topics/{subject.Topics.Single().Id}", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_topic_that_belongs_to_another_subject_is_a_404()
    {
        await GiveItTopics("First");
        var client = await AsLecturer();

        var response = await client.PatchJson(
            $"/api/Subjects/{_subjectId}/topics/{Guid.NewGuid()}", new { isHidden = true });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("TopicNotFoundException", (await response.ReadProblem()).Title);
    }

    [Fact]
    public async Task The_lecturer_may_reorder_the_topics()
    {
        var subject = await GiveItTopics("First", "Second", "Third");
        var client = await AsLecturer();

        var reversed = subject.Topics.Select(topic => topic.Id).Reverse().ToArray();

        var response = await client.PutJson(
            $"/api/Subjects/{_subjectId}/topics/order", new { topicIds = reversed });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["Third", "Second", "First"], (await Mine()).Topics.Select(topic => topic.Title));
    }

    [Fact]
    public async Task An_order_that_does_not_name_every_topic_is_refused()
    {
        var subject = await GiveItTopics("First", "Second");
        var client = await AsLecturer();

        var response = await client.PutJson($"/api/Subjects/{_subjectId}/topics/order",
            new { topicIds = new[] { subject.Topics.First().Id } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("BadRequestException", (await response.ReadProblem()).Title);
    }

    #endregion

    #region Staff

    [Fact]
    public async Task An_administrator_sets_the_staff()
    {
        var admin = await AsAdmin();

        var response = await admin.PutJson($"/api/Subjects/{_subjectId}/staff",
            new { lecturer = OtherLecturer, assistant = Assistant });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var subject = await Mine();

        Assert.Equal(OtherLecturer, subject.Lecturer);
        Assert.Equal(Assistant, subject.Assistant);
    }

    [Fact]
    public async Task A_lecturer_may_not_set_the_staff_even_on_their_own_subject()
    {
        var client = await AsLecturer();

        var response = await client.PutJson($"/api/Subjects/{_subjectId}/staff",
            new { lecturer = Lecturer, assistant = (string?)null });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task A_username_nobody_has_is_refused_before_anything_is_written()
    {
        var admin = await AsAdmin();

        var response = await admin.PutJson($"/api/Subjects/{_subjectId}/staff",
            new { lecturer = "nobody", assistant = (string?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(Lecturer, (await Mine()).Lecturer);
    }

    [Fact]
    public async Task An_assistant_left_blank_removes_the_assistant()
    {
        var admin = await AsAdmin();

        (await admin.PutJson($"/api/Subjects/{_subjectId}/staff",
            new { lecturer = Lecturer, assistant = Assistant })).EnsureSuccessStatusCode();

        (await admin.PutJson($"/api/Subjects/{_subjectId}/staff",
            new { lecturer = Lecturer, assistant = "" })).EnsureSuccessStatusCode();

        Assert.Null((await Mine()).Assistant);
    }

    #endregion

    #region Concurrency

    /// <summary>
    /// Two lecturers with the same subject open. The second save is refused rather than quietly
    /// discarding the first, which is what the version travelling to the client and back is for.
    /// </summary>
    [Fact]
    public async Task A_save_built_on_a_version_someone_else_has_moved_is_a_409()
    {
        var admin = await AsAdmin();
        var opened = await Mine(admin);

        (await Update(admin, UpdateBody(opened, title: "Saved first"))).EnsureSuccessStatusCode();

        var response = await Update(admin, UpdateBody(opened, title: "Saved second"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("ConcurrencyException", (await response.ReadProblem()).Title);
        Assert.Equal("Saved first", (await Mine()).Title);
    }

    /// <summary>
    /// Zero means the client sent no version, and the save goes through unchecked - which is what
    /// keeps a caller written before the version existed working.
    /// </summary>
    [Fact]
    public async Task A_save_that_carries_no_version_is_not_checked()
    {
        var admin = await AsAdmin();
        var opened = await Mine(admin);

        (await Update(admin, UpdateBody(opened, title: "Saved first"))).EnsureSuccessStatusCode();

        var response = await Update(admin, UpdateBody(opened, title: "Saved anyway", version: 0));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Saved anyway", (await Mine()).Title);
    }

    #endregion

    #region Deleting

    [Fact]
    public async Task A_lecturer_may_not_delete_their_own_subject()
    {
        var client = await AsLecturer();

        var response = await client.DeleteAsync($"/api/Subjects/{_subjectId}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task An_administrator_deletes_a_subject_and_it_is_then_gone()
    {
        var admin = await AsAdmin();

        var response = await admin.DeleteAsync($"/api/Subjects/{_subjectId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/Subjects/{_subjectId}")).StatusCode);
    }

    #endregion
}
