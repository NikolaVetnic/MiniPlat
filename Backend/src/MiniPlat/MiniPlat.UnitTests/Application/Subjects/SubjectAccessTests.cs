using MiniPlat.Application.Entities.Subjects;

namespace MiniPlat.UnitTests.Application.Subjects;

public class SubjectAccessTests
{
    [Fact]
    public void An_administrator_may_manage_a_subject_they_have_nothing_to_do_with()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");

        Assert.True(subject.CanManage(FakeCurrentUser.Admin("carol")));
    }

    [Fact]
    public void The_lecturer_may_manage_their_own_subject()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");

        Assert.True(subject.CanManage(FakeCurrentUser.Named("ana")));
    }

    [Fact]
    public void The_assistant_may_manage_the_subject_they_assist_on()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");

        Assert.True(subject.CanManage(FakeCurrentUser.Named("bob")));
    }

    [Fact]
    public void Another_lecturer_may_not()
    {
        var subject = Some.Subject(lecturer: "ana", assistant: "bob");

        Assert.False(subject.CanManage(FakeCurrentUser.Named("carol")));
    }

    [Fact]
    public void An_anonymous_caller_may_not()
    {
        Assert.False(Some.Subject().CanManage(FakeCurrentUser.Anonymous()));
    }

    /// <summary>
    /// A subject with no assistant holds an empty string in that column on some rows and null on
    /// others. Neither may match a caller whose username is missing, which is the check the
    /// leading IsNullOrEmpty guard exists for.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void An_empty_username_never_matches_an_empty_staff_field(string? assistant)
    {
        var subject = Some.Subject(lecturer: "", assistant: assistant);

        Assert.False(subject.CanManage(new FakeCurrentUser(username: "")));
        Assert.False(subject.CanManage(new FakeCurrentUser(username: null)));
    }

    [Fact]
    public void Matching_is_case_sensitive()
    {
        var subject = Some.Subject(lecturer: "ana");

        Assert.False(subject.CanManage(FakeCurrentUser.Named("Ana")));
    }
}

public class SubjectRedactionTests
{
    private static Subject SubjectWithEverything() => Some.Subject(
        lecturer: "ana",
        topics:
        [
            Some.Topic(title: "Visible", materials:
            [
                Some.Material(description: "Kept"),
                Some.Material(description: "Removed", isDeleted: true)
            ]),
            Some.Topic(title: "Hidden", isHidden: true),
            Some.Topic(title: "Deleted", isDeleted: true)
        ]);

    [Fact]
    public void Someone_who_may_manage_the_subject_sees_all_of_it()
    {
        var subject = SubjectWithEverything();

        var result = subject.Redact(FakeCurrentUser.Named("ana"));

        Assert.Equal(3, result.Topics.Count);
        Assert.Equal(2, result.Topics[0].Materials.Count);
    }

    [Fact]
    public void An_administrator_sees_all_of_it_as_well()
    {
        var result = SubjectWithEverything().Redact(FakeCurrentUser.Admin());

        Assert.Equal(3, result.Topics.Count);
    }

    [Fact]
    public void A_student_sees_neither_hidden_nor_deleted_topics()
    {
        var result = SubjectWithEverything().Redact(FakeCurrentUser.Anonymous());

        Assert.Equal(["Visible"], result.Topics.Select(topic => topic.Title));
    }

    [Fact]
    public void A_student_sees_no_deleted_material_on_the_topics_that_remain()
    {
        var result = SubjectWithEverything().Redact(FakeCurrentUser.Anonymous());

        Assert.Equal(["Kept"], result.Topics.Single().Materials.Select(material => material.Description));
    }

    [Fact]
    public void Redacting_trims_the_subject_in_place_and_hands_the_same_one_back()
    {
        var subject = SubjectWithEverything();

        var result = subject.Redact(FakeCurrentUser.Anonymous());

        Assert.Same(subject, result);
        Assert.Single(subject.Topics);
    }

    [Fact]
    public void A_subject_without_topics_survives_redaction()
    {
        var result = Some.Subject().Redact(FakeCurrentUser.Anonymous());

        Assert.Empty(result.Topics);
    }

    [Fact]
    public void Redacting_a_list_redacts_each_subject_in_it()
    {
        List<Subject> subjects = [SubjectWithEverything(), SubjectWithEverything()];

        var result = subjects.Redact(FakeCurrentUser.Anonymous());

        Assert.Equal(2, result.Count);
        Assert.All(result, subject => Assert.Single(subject.Topics));
    }

    /// <summary>
    /// Redaction is per subject, not per request: a lecturer listing the catalogue keeps their
    /// own hidden topics while everyone else's stay trimmed.
    /// </summary>
    [Fact]
    public void Redacting_a_list_judges_each_subject_on_its_own_staff()
    {
        var mine = Some.Subject(lecturer: "ana", topics: [Some.Topic(isHidden: true)]);
        var theirs = Some.Subject(lecturer: "carol", topics: [Some.Topic(isHidden: true)]);

        var result = new[] { mine, theirs }.Redact(FakeCurrentUser.Named("ana"));

        Assert.Single(result[0].Topics);
        Assert.Empty(result[1].Topics);
    }
}
