using MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

namespace MiniPlat.UnitTests.Application.Subjects;

public class UpdateSubjectCommandValidatorTests
{
    private readonly UpdateSubjectCommandValidator _validator = new();

    private static UpdateSubjectCommand WithLinks(params string?[] links) => new()
    {
        Id = SubjectId.Of(Guid.NewGuid()),
        Topics =
        [
            Some.Topic(materials: links.Select(link => Some.Material(link: link!)).ToList())
        ]
    };

    [Theory]
    [InlineData("https://example.test/slides.pdf")]
    [InlineData("http://example.test/slides.pdf")]
    [InlineData("HTTPS://EXAMPLE.TEST/SLIDES.PDF")]
    public void A_web_address_is_accepted(string link)
    {
        Assert.True(_validator.Validate(WithLinks(link)).IsValid);
    }

    /// <summary>
    /// A lecturer editing their own subject could otherwise store a script URL, which the
    /// browser runs in a student's session the moment the link is clicked.
    /// </summary>
    [Theory]
    [InlineData("javascript:alert(document.cookie)")]
    [InlineData("JavaScript:alert(1)")]
    [InlineData("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")]
    [InlineData("file:///etc/passwd")]
    [InlineData("ftp://example.test/slides.pdf")]
    [InlineData("vbscript:msgbox(1)")]
    public void Anything_that_is_not_http_or_https_is_rejected(string link)
    {
        var result = _validator.Validate(WithLinks(link));

        Assert.False(result.IsValid);
        Assert.Contains(link, result.Errors.Single().ErrorMessage);
    }

    /// <summary>A relative link is not absolute, so it does not parse and is refused.</summary>
    [Fact]
    public void A_relative_link_is_rejected()
    {
        Assert.False(_validator.Validate(WithLinks("/uploads/slides.pdf")).IsValid);
    }

    /// <summary>A material may carry only a description, with nothing to link to yet.</summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void A_material_with_no_link_at_all_is_accepted(string? link)
    {
        Assert.True(_validator.Validate(WithLinks(link)).IsValid);
    }

    [Fact]
    public void Every_bad_link_in_the_subject_is_reported_not_just_the_first()
    {
        var result = _validator.Validate(WithLinks("javascript:alert(1)", "https://ok.test", "data:,x"));

        Assert.Equal(2, result.Errors.Count);
    }

    [Fact]
    public void Bad_links_are_found_on_every_topic()
    {
        var command = new UpdateSubjectCommand
        {
            Id = SubjectId.Of(Guid.NewGuid()),
            Topics =
            [
                Some.Topic(materials: [Some.Material(link: "https://ok.test")]),
                Some.Topic(materials: [Some.Material(link: "javascript:alert(1)")])
            ]
        };

        Assert.False(_validator.Validate(command).IsValid);
    }

    [Fact]
    public void A_command_that_leaves_the_topics_alone_is_valid()
    {
        var command = new UpdateSubjectCommand { Id = SubjectId.Of(Guid.NewGuid()), Topics = null };

        Assert.True(_validator.Validate(command).IsValid);
    }

    [Fact]
    public void A_topic_that_arrives_without_a_material_list_is_valid()
    {
        var topic = Some.Topic();
        topic.Materials = null!;

        var command = new UpdateSubjectCommand { Id = SubjectId.Of(Guid.NewGuid()), Topics = [topic] };

        Assert.True(_validator.Validate(command).IsValid);
    }
}
