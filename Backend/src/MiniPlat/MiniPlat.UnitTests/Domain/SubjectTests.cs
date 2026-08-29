namespace MiniPlat.UnitTests.Domain;

public class SubjectTests
{
    [Fact]
    public void Create_carries_every_argument_onto_the_subject()
    {
        var id = SubjectId.Of(Guid.NewGuid());

        var subject = Subject.Create(id, "Mini Platforms", "An introduction.", "MP101",
            Level.Master, 3, 7, "ana", "bob");

        Assert.Equal(id, subject.Id);
        Assert.Equal("Mini Platforms", subject.Title);
        Assert.Equal("An introduction.", subject.Description);
        Assert.Equal("MP101", subject.Code);
        Assert.Equal(Level.Master, subject.Level);
        Assert.Equal(3, subject.Semester);
        Assert.Equal(7, subject.Order);
        Assert.Equal("ana", subject.Lecturer);
        Assert.Equal("bob", subject.Assistant);
    }

    /// <summary>
    /// A newly created subject is running and visible: SubjectViewer.CanSee turns on IsActive,
    /// so a default of false would hide every subject the moment it is created.
    /// </summary>
    [Fact]
    public void A_created_subject_is_active_and_has_no_topics()
    {
        var subject = Subject.Create(SubjectId.Of(Guid.NewGuid()), "t", "d", "c",
            Level.Undergraduate, 1, 0, "ana", "bob");

        Assert.True(subject.IsActive);
        Assert.False(subject.IsDeleted);
        Assert.Empty(subject.Topics);
        Assert.Equal(0u, subject.Version);
    }
}
