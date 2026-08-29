using System.Net;

namespace MiniPlat.IntegrationTests.Api;

public class AccountEndpointsTests(MiniPlatFixture fixture) : ApiTestBase(fixture)
{
    private static object Registration(string username, string firstName = "New", string lastName = "Lecturer") => new
    {
        username,
        email = $"{username}@example.test",
        password = "P@ssw0rd!new1",
        firstName,
        lastName,
        title = "Docent",
        department = "Informatics"
    };

    private static string UniqueUsername() => $"usr{Guid.NewGuid():N}"[..12];

    [Fact]
    public async Task Registering_is_closed_to_anyone_without_a_token()
    {
        var response = await Anonymous.PostJson("/api/Account/Register", Registration(UniqueUsername()));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_lecturer_may_not_register_anyone()
    {
        var client = await AsLecturer();

        var response = await client.PostJson("/api/Account/Register", Registration(UniqueUsername()));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task An_administrator_registers_a_lecturer_who_can_then_be_looked_up()
    {
        var username = UniqueUsername();
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/Register", Registration(username));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = (await (await Anonymous.GetAsync($"/api/Lecturers/{username}")).ReadAs<GetLecturerWire>())
            .Lecturer;

        Assert.Equal("Docent", profile.Title);
        Assert.Equal("Informatics", profile.Department);
    }

    [Fact]
    public async Task A_newly_registered_lecturer_can_sign_in()
    {
        var username = UniqueUsername();
        var admin = await AsAdmin();

        (await admin.PostJson("/api/Account/Register", Registration(username))).EnsureSuccessStatusCode();

        Assert.False(string.IsNullOrWhiteSpace(await Fixture.RequestToken(username, "P@ssw0rd!new1")));
    }

    [Fact]
    public async Task A_registration_with_no_name_on_it_is_refused()
    {
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/Register",
            Registration(UniqueUsername(), firstName: "", lastName: ""));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("ValidationException", (await response.ReadProblem()).Title);
    }

    /// <summary>
    /// Identity's own rules still apply underneath the validators, and what it objected to is
    /// passed back rather than flattened into one message.
    /// </summary>
    [Fact]
    public async Task A_password_identity_will_not_accept_comes_back_with_the_reason()
    {
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/Register", new
        {
            username = UniqueUsername(),
            email = "weak@example.test",
            password = "weak",
            firstName = "Weak",
            lastName = "Password",
            title = "Docent",
            department = "Informatics"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotEmpty(await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_username_that_is_taken_is_refused()
    {
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/Register", Registration(Lecturer));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// One bad row does not sink the batch: the import is what seeds a whole department at once.
    /// </summary>
    [Fact]
    public async Task A_batch_registration_reports_the_rows_it_could_not_take_and_keeps_the_rest()
    {
        var good = UniqueUsername();
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/RegisterMultiple", new
        {
            users = new[] { Registration(good), Registration(Lecturer) }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains(Lecturer, await response.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, (await Anonymous.GetAsync($"/api/Lecturers/{good}")).StatusCode);
    }

    [Fact]
    public async Task A_batch_where_everyone_is_new_succeeds()
    {
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Account/RegisterMultiple", new
        {
            users = new[] { Registration(UniqueUsername()), Registration(UniqueUsername()) }
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
