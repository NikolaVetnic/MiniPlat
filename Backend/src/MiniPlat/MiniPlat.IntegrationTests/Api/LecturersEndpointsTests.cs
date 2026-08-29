using System.Net;

namespace MiniPlat.IntegrationTests.Api;

public class LecturersEndpointsTests(MiniPlatFixture fixture) : ApiTestBase(fixture)
{
    [Fact]
    public async Task A_lecturer_profile_is_open_to_anyone()
    {
        var response = await Anonymous.GetAsync($"/api/Lecturers/{Lecturer}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var lecturer = (await response.ReadAs<GetLecturerWire>()).Lecturer;

        Assert.Equal(Lecturer, lecturer.Username);
        Assert.Equal("dr", lecturer.Title);
        Assert.Equal("User", lecturer.FirstName);
    }

    /// <summary>
    /// The profile is projected rather than serialised from the entity, whose User navigation is
    /// an IdentityUser - returning that would hand a caller the password hash and security stamp
    /// along with the name.
    /// </summary>
    [Fact]
    public async Task A_lecturer_profile_carries_nothing_from_the_identity_record_beyond_the_name()
    {
        var body = await (await Anonymous.GetAsync($"/api/Lecturers/{Lecturer}")).Content.ReadAsStringAsync();

        Assert.DoesNotContain("passwordHash", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("securityStamp", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("lockout", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task A_username_nobody_has_is_a_404()
    {
        var response = await Anonymous.GetAsync("/api/Lecturers/nobody");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("LecturerNotFoundException", (await response.ReadProblem()).Title);
    }

    [Fact]
    public async Task An_empty_username_does_not_reach_the_profile_route()
    {
        var response = await Anonymous.GetAsync("/api/Lecturers/");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>
    /// The roster is behind a token rather than an api key, because the api key ships inside the
    /// frontend bundle and would leave the whole staff list readable by anyone.
    /// </summary>
    [Fact]
    public async Task The_roster_is_closed_to_anyone_without_a_token()
    {
        var response = await Anonymous.GetAsync("/api/Lecturers");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_signed_in_lecturer_may_read_the_roster()
    {
        var client = await AsLecturer();

        var response = await client.GetAsync("/api/Lecturers");
        var lecturers = (await response.ReadAs<ListLecturersWire>()).Lecturers;

        Assert.Contains(lecturers, lecturer => lecturer.Username == Lecturer);
        Assert.Contains(lecturers, lecturer => lecturer.Username == OtherLecturer);
    }

    [Fact]
    public async Task The_roster_is_ordered_by_surname()
    {
        var client = await AsAdmin();

        var lecturers = (await (await client.GetAsync("/api/Lecturers")).ReadAs<ListLecturersWire>()).Lecturers;

        Assert.Equal(
            lecturers.Select(lecturer => lecturer.LastName).ToList(),
            lecturers.Select(lecturer => lecturer.LastName).OrderBy(name => name, StringComparer.Ordinal).ToList());
    }
}
