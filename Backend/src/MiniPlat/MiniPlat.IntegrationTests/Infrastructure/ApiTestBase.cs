namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// A test that goes through the HTTP surface, against the seeded catalogue.
///
/// Anything that writes creates a subject of its own and removes it afterwards, so the four
/// seeded subjects stay exactly as the seeder left them for the tests that read.
/// </summary>
[Collection(MiniPlatCollection.Name)]
public abstract class ApiTestBase(MiniPlatFixture fixture)
{
    /// <summary>Seeded accounts. USRa teaches PED-001 and the one subject that is switched off.</summary>
    protected const string Lecturer = "USRa";

    protected const string LecturerPassword = "P@ssw0rd!123";
    protected const string OtherLecturer = "USRb";
    protected const string OtherLecturerPassword = "P@ssw0rd?456";
    protected const string Assistant = "USRc";
    protected const string AssistantPassword = "P@ssw0rd.789";

    /// <summary>Seeded subjects. KNJ-001 is the one that is not running.</summary>
    protected const string RunningSubject = "PED-001";

    protected const string RunningSubjectId = "112f020b-f871-47ee-a1f4-b4cc8aa2dd53";
    protected const string SubjectThatIsOff = "KNJ-001";
    protected const string SubjectThatIsOffId = "c1cf8b0e-722c-44ac-b461-4c5ebfd2ffe8";

    protected MiniPlatFixture Fixture { get; } = fixture;

    protected HttpClient Anonymous => Fixture.Client;

    protected Task<HttpClient> AsAdmin() => Fixture.AdminClient();

    protected Task<HttpClient> AsLecturer() => Fixture.ClientFor(Lecturer, LecturerPassword);

    protected Task<HttpClient> AsOtherLecturer() => Fixture.ClientFor(OtherLecturer, OtherLecturerPassword);

    protected Task<HttpClient> AsAssistant() => Fixture.ClientFor(Assistant, AssistantPassword);

    protected async Task<string> CreateSubject(string code, string lecturer = Lecturer, string? assistant = null)
    {
        var admin = await AsAdmin();

        var response = await admin.PostJson("/api/Subjects", new
        {
            title = $"Subject {code}",
            code,
            description = "Created by a test.",
            level = (int)Level.Undergraduate,
            semester = 1,
            lecturer,
            assistant = assistant ?? string.Empty
        });

        return (await response.ReadAs<CreateSubjectWire>()).SubjectId;
    }

    protected async Task DeleteSubject(string id)
    {
        var admin = await AsAdmin();

        (await admin.DeleteAsync($"/api/Subjects/{id}")).EnsureSuccessStatusCode();
    }

    protected async Task<SubjectWire> GetSubject(string id, HttpClient? client = null)
    {
        var response = await (client ?? Anonymous).GetAsync($"/api/Subjects/{id}");

        return (await response.ReadAs<GetSubjectWire>()).Subject;
    }

    /// <summary>
    /// A full update body. Every field goes on the wire every time, because the command reads a
    /// missing string as an empty one rather than as "leave this alone".
    /// </summary>
    protected static object UpdateBody(SubjectWire subject, string? title = null, object? topics = null,
        uint? version = null, string? lecturer = null, string? assistant = null) => new
    {
        title = title ?? subject.Title,
        code = subject.Code,
        description = subject.Description,
        level = subject.Level,
        semester = subject.Semester,
        lecturer = lecturer ?? subject.Lecturer,
        assistant = assistant ?? subject.Assistant,
        topics = topics ?? subject.Topics,
        version = version ?? subject.Version
    };

    protected static object NewTopic(string title, bool isHidden = false, bool isDeleted = false,
        object[]? materials = null) => new
    {
        id = Guid.NewGuid().ToString(),
        title,
        description = "Added by a test.",
        order = 0,
        materials = materials ?? [],
        isHidden,
        isDeleted
    };
}
