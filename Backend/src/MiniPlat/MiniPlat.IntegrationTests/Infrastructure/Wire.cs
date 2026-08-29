namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// What the endpoints actually put on the wire, written out by hand rather than reusing the
/// server's own types. Deserialising into these is what makes a renamed or dropped field fail
/// here instead of in the frontend.
/// </summary>
public sealed record PageWire<T>(int PageIndex, int PageSize, long Count, List<T> Data);

public sealed record SubjectWire(
    string Id,
    string Code,
    string Title,
    string Description,
    int Level,
    int Semester,
    int Order,
    string Lecturer,
    string? Assistant,
    List<TopicWire> Topics,
    bool IsActive,
    uint Version);

public sealed record TopicWire(
    string Id,
    string Title,
    string Description,
    int Order,
    List<MaterialWire> Materials,
    bool IsHidden,
    bool IsDeleted);

public sealed record MaterialWire(string Id, string Description, string Link, int Order);

public sealed record ListSubjectsWire(PageWire<SubjectWire> Subjects);

public sealed record GetSubjectWire(SubjectWire Subject);

public sealed record CreateSubjectWire(string SubjectId);

public sealed record UpdateSubjectWire(SubjectWire Subject);

public sealed record LecturerDetailsWire(
    string Username, string? Title, string? Department, string? FirstName, string? LastName, string? Email);

public sealed record GetLecturerWire(LecturerDetailsWire Lecturer);

public sealed record LecturerSummaryWire(string Username, string? Title, string? FirstName, string? LastName);

public sealed record ListLecturersWire(List<LecturerSummaryWire> Lecturers);

public sealed record UserInfoWire(
    string Sub, string Username, string? Email, string? FirstName, string? LastName,
    string? Title, string? Department);

public sealed record ProblemWire(string? Title, string? Detail, int? Status, string? Instance);
