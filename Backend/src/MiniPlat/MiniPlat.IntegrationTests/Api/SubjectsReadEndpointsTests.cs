using System.Net;

namespace MiniPlat.IntegrationTests.Api;

public class SubjectsReadEndpointsTests(MiniPlatFixture fixture) : ApiTestBase(fixture)
{
    private async Task<List<string>> ListedCodes(HttpClient client)
    {
        var response = await client.GetAsync("/api/Subjects?pageIndex=0&pageSize=1000");
        var page = (await response.ReadAs<ListSubjectsWire>()).Subjects;

        return page.Data.Select(subject => subject.Code).ToList();
    }

    [Fact]
    public async Task The_catalogue_is_open_to_anyone()
    {
        var response = await Anonymous.GetAsync("/api/Subjects");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(RunningSubject, (await response.ReadAs<ListSubjectsWire>()).Subjects.Data
            .Select(subject => subject.Code));
    }

    [Fact]
    public async Task A_subject_that_is_not_running_is_absent_from_the_public_catalogue()
    {
        Assert.DoesNotContain(SubjectThatIsOff, await ListedCodes(Anonymous));
    }

    [Fact]
    public async Task The_lecturer_of_a_subject_that_is_off_still_sees_it_in_the_catalogue()
    {
        Assert.Contains(SubjectThatIsOff, await ListedCodes(await AsLecturer()));
    }

    [Fact]
    public async Task Its_assistant_sees_it_too()
    {
        Assert.Contains(SubjectThatIsOff, await ListedCodes(await AsAssistant()));
    }

    [Fact]
    public async Task An_administrator_sees_it()
    {
        Assert.Contains(SubjectThatIsOff, await ListedCodes(await AsAdmin()));
    }

    [Fact]
    public async Task A_lecturer_with_nothing_to_do_with_it_does_not()
    {
        Assert.DoesNotContain(SubjectThatIsOff, await ListedCodes(await AsOtherLecturer()));
    }

    [Fact]
    public async Task The_page_reports_the_size_it_was_asked_for_and_the_total_behind_it()
    {
        var response = await Anonymous.GetAsync("/api/Subjects?pageIndex=0&pageSize=2");
        var page = (await response.ReadAs<ListSubjectsWire>()).Subjects;

        Assert.Equal(0, page.PageIndex);
        Assert.Equal(2, page.PageSize);
        Assert.True(page.Count >= 3, "The seeded catalogue holds at least three running subjects.");
        Assert.Equal(2, page.Data.Count);
    }

    /// <summary>
    /// A page size no database would accept is clamped rather than refused, because this is an
    /// anonymous read endpoint and a 500 is not something the caller could act on.
    /// </summary>
    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageIndex=-1")]
    [InlineData("pageSize=100000")]
    public async Task A_page_outside_the_allowed_range_is_answered_rather_than_refused(string query)
    {
        var response = await Anonymous.GetAsync($"/api/Subjects?{query}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task A_running_subject_can_be_opened_by_anyone()
    {
        var subject = await GetSubject(RunningSubjectId);

        Assert.Equal(RunningSubject, subject.Code);
        Assert.Equal(Lecturer, subject.Lecturer);
        Assert.NotEmpty(subject.Topics);
    }

    /// <summary>
    /// Reported as missing rather than forbidden: a 403 would confirm the id names something
    /// real, which is the thing being withheld.
    /// </summary>
    [Fact]
    public async Task A_subject_that_is_off_is_missing_as_far_as_a_student_is_concerned()
    {
        var response = await Anonymous.GetAsync($"/api/Subjects/{SubjectThatIsOffId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("SubjectNotFoundException", (await response.ReadProblem()).Title);
    }

    [Fact]
    public async Task Its_lecturer_can_open_it()
    {
        var subject = await GetSubject(SubjectThatIsOffId, await AsLecturer());

        Assert.Equal(SubjectThatIsOff, subject.Code);
        Assert.False(subject.IsActive);
    }

    [Fact]
    public async Task An_id_that_names_nothing_is_a_404()
    {
        var response = await Anonymous.GetAsync($"/api/Subjects/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Bound by the route binder, so a malformed id is the bad request it is rather than a
    /// FormatException surfacing as a 500.
    /// </summary>
    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    public async Task An_id_that_is_not_a_guid_is_a_400(string id)
    {
        var response = await Anonymous.GetAsync($"/api/Subjects/{id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_subject_carries_the_version_the_client_has_to_send_back()
    {
        Assert.NotEqual(0u, (await GetSubject(RunningSubjectId)).Version);
    }

    [Fact]
    public async Task A_lecturers_own_listing_is_closed_to_anyone_without_a_token()
    {
        var response = await Anonymous.GetAsync("/api/Subjects/user");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_lecturers_own_listing_holds_their_subjects_and_no_one_elses()
    {
        var client = await AsLecturer();

        var response = await client.GetAsync("/api/Subjects/user?pageIndex=0&pageSize=1000");
        var codes = (await response.ReadAs<ListSubjectsWire>()).Subjects.Data
            .Select(subject => subject.Code)
            .ToList();

        Assert.Contains(RunningSubject, codes);
        Assert.Contains(SubjectThatIsOff, codes);
        Assert.DoesNotContain("PSI-001", codes);
    }
}
