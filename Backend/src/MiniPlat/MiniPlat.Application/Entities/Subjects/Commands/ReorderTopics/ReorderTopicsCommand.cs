using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.ReorderTopics;

/// <summary>
/// Sets the display order of a subject's topics from the position of each id in the list.
/// Separate from UpdateSubject because that one replaces the whole topic and material graph,
/// which is far too much work for a move up or down.
/// </summary>
public record ReorderTopicsCommand(SubjectId Id, IReadOnlyList<TopicId> OrderedTopicIds)
    : ICommand<ReorderTopicsResult>;

public record ReorderTopicsResult(bool Reordered);
