using MiniPlat.Application.Entities.Subjects;

namespace MiniPlat.UnitTests.Application.Subjects;

public class SubjectViewerTests
{
    private static Func<Subject, bool> CanSee(SubjectViewer viewer) => viewer.CanSee.Compile();

    [Fact]
    public void For_describes_the_caller_by_username_and_role()
    {
        var viewer = SubjectViewer.For(FakeCurrentUser.Admin("carol"));

        Assert.Equal("carol", viewer.Username);
        Assert.True(viewer.IsAdmin);
    }

    [Fact]
    public void A_running_subject_is_visible_to_anyone()
    {
        var subject = Some.Subject(isActive: true, lecturer: "ana");

        Assert.True(CanSee(SubjectViewer.For(FakeCurrentUser.Anonymous()))(subject));
    }

    [Fact]
    public void A_subject_that_is_not_running_is_hidden_from_students()
    {
        var subject = Some.Subject(isActive: false, lecturer: "ana");

        Assert.False(CanSee(SubjectViewer.For(FakeCurrentUser.Anonymous()))(subject));
        Assert.False(CanSee(SubjectViewer.For(FakeCurrentUser.Named("carol")))(subject));
    }

    [Fact]
    public void An_administrator_sees_a_subject_that_is_not_running()
    {
        var subject = Some.Subject(isActive: false, lecturer: "ana");

        Assert.True(CanSee(SubjectViewer.For(FakeCurrentUser.Admin()))(subject));
    }

    [Fact]
    public void The_staff_responsible_see_their_own_subject_while_it_is_off()
    {
        var subject = Some.Subject(isActive: false, lecturer: "ana", assistant: "bob");

        Assert.True(CanSee(SubjectViewer.For(FakeCurrentUser.Named("ana")))(subject));
        Assert.True(CanSee(SubjectViewer.For(FakeCurrentUser.Named("bob")))(subject));
    }

    /// <summary>
    /// The username guard is what keeps an anonymous viewer from matching a subject whose
    /// assistant column is null - in SQL that comparison is not false but unknown.
    /// </summary>
    [Fact]
    public void An_unnamed_viewer_does_not_match_a_subject_with_no_assistant()
    {
        var subject = Some.Subject(isActive: false, lecturer: "ana", assistant: null);

        Assert.False(CanSee(new SubjectViewer(null, false))(subject));
    }

    /// <summary>
    /// Held as an expression rather than a delegate so the database applies it: an in-memory
    /// filter would leave pagination counting rows the caller never receives.
    /// </summary>
    [Fact]
    public void The_rule_is_an_expression_a_query_provider_can_translate()
    {
        var viewer = SubjectViewer.For(FakeCurrentUser.Named("ana"));

        var matching = new[]
        {
            Some.Subject(isActive: true, lecturer: "carol"),
            Some.Subject(isActive: false, lecturer: "ana"),
            Some.Subject(isActive: false, lecturer: "carol")
        }.AsQueryable().Where(viewer.CanSee).ToList();

        Assert.Equal(2, matching.Count);
    }
}
