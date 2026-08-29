namespace MiniPlat.UnitTests.TestSupport;

/// <summary>
/// Entity factories with every field defaulted, so a test names only the parts it is about.
/// </summary>
internal static class Some
{
    public const string LecturerName = "ana";
    public const string AssistantName = "bob";

    public static Subject Subject(
        SubjectId? id = null,
        string lecturer = LecturerName,
        string? assistant = null,
        bool isActive = true,
        List<Topic>? topics = null) => new()
    {
        Id = id ?? SubjectId.Of(Guid.NewGuid()),
        Code = "MP101",
        Title = "Mini Platforms",
        Description = "An introduction.",
        Level = Level.Undergraduate,
        Semester = 1,
        Order = 0,
        Lecturer = lecturer,
        Assistant = assistant,
        IsActive = isActive,
        Topics = topics ?? []
    };

    public static Topic Topic(
        TopicId? id = null,
        string title = "Topic",
        int order = 0,
        bool isHidden = false,
        bool isDeleted = false,
        List<Material>? materials = null) => new()
    {
        Id = id ?? TopicId.Of(Guid.NewGuid()),
        Title = title,
        Description = "A topic.",
        Order = order,
        IsHidden = isHidden,
        IsDeleted = isDeleted,
        Materials = materials ?? []
    };

    public static Material Material(
        MaterialId? id = null,
        string description = "Slides",
        string link = "https://example.test/slides.pdf",
        bool isDeleted = false) => new()
    {
        Id = id ?? MaterialId.Of(Guid.NewGuid()),
        Description = description,
        Link = link,
        IsDeleted = isDeleted
    };

    public static Lecturer Lecturer(
        string username = LecturerName,
        string? title = "Professor",
        string? department = "Informatics",
        string? firstName = "Ana",
        string? lastName = "Aalto",
        string? email = "ana@example.test") => new()
    {
        Id = LecturerId.Of(Guid.NewGuid()),
        Title = title,
        Department = department,
        UserId = Guid.NewGuid().ToString(),
        User = new ApplicationUser
        {
            UserName = username,
            FirstName = firstName,
            LastName = lastName,
            Email = email
        }
    };
}
