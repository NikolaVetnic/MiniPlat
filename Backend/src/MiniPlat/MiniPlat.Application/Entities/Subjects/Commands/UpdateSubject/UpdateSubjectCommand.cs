using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

public class UpdateSubjectCommand : ICommand<UpdateSubjectResult>
{
    public required SubjectId Id { get; set; }
    public string? Title { get; set; } = string.Empty;
    public string? Code { get; set; } = string.Empty;
    public string? Description { get; set; } = string.Empty;
    public Level? Level { get; set; }
    public int? Semester { get; set; }
    public int? Order { get; set; }
    public string? Lecturer { get; set; } = string.Empty;
    public string? Assistant { get; set; }
    public List<Topic>? Topics { get; set; } = [];

    /// <summary>
    /// The version the caller last read. Zero means the caller did not supply one, and the save
    /// proceeds without a conflict check - kept so existing callers are not broken by this.
    /// </summary>
    public uint Version { get; set; }
}

public record UpdateSubjectResult(Subject Subject);
public class UpdateSubjectCommandValidator : AbstractValidator<UpdateSubjectCommand>
{
    public UpdateSubjectCommandValidator()
    {
        RuleFor(command => command.Topics).Custom((topics, context) =>
        {
            var materials = topics?.SelectMany(topic => topic.Materials ?? []) ?? [];

            foreach (var material in materials.Where(material => !IsSafeLink(material.Link)))
                context.AddFailure(
                    $"Material link '{material.Link}' must be an http or https address.");
        });
    }

    /// <summary>
    /// Anything but http and https is rejected. A lecturer could otherwise store a
    /// "javascript:..." link, which the browser would run in a student's session when clicked.
    /// An empty link is allowed: a material may carry only a description.
    /// </summary>
    private static bool IsSafeLink(string? link) =>
        string.IsNullOrWhiteSpace(link) ||
        (Uri.TryCreate(link, UriKind.Absolute, out var uri) &&
         (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps));
}
