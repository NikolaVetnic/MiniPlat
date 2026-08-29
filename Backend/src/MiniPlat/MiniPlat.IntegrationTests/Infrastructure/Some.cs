namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>Entity factories with everything defaulted, so a test names only what it is about.</summary>
internal static class Some
{
    public static Subject Subject(
        SubjectId? id = null,
        string code = "MP101",
        string title = "Mini Platforms",
        string lecturer = "ana",
        string? assistant = null,
        Level level = Level.Undergraduate,
        int semester = 1,
        int order = 0,
        bool isActive = true,
        List<Topic>? topics = null) => new()
    {
        Id = id ?? SubjectId.Of(Guid.NewGuid()),
        Code = code,
        Title = title,
        Description = "An introduction.",
        Level = level,
        Semester = semester,
        Order = order,
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
        DateTime? deletedAt = null,
        List<Material>? materials = null) => new()
    {
        Id = id ?? TopicId.Of(Guid.NewGuid()),
        Title = title,
        Description = "A topic.",
        Order = order,
        IsHidden = isHidden,
        IsDeleted = isDeleted,
        DeletedAt = deletedAt,
        Materials = materials ?? []
    };

    public static Material Material(
        MaterialId? id = null,
        string description = "Slides",
        string link = "https://example.test/slides.pdf",
        int order = 0) => new()
    {
        Id = id ?? MaterialId.Of(Guid.NewGuid()),
        Description = description,
        Link = link,
        Order = order
    };

    public static Lecturer Lecturer(string userId, string? title = "Professor", string? department = "Informatics") =>
        new()
        {
            Id = LecturerId.Of(Guid.NewGuid()),
            Title = title,
            Department = department,
            UserId = userId
        };
}
