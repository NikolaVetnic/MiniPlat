using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateTopicState;

/// <summary>
/// Flips the hidden and deleted flags on a single topic. A null flag is left alone.
/// Separate from UpdateSubject, which replaces the whole topic and material graph - far too
/// much work for one boolean.
/// </summary>
public record UpdateTopicStateCommand(SubjectId Id, TopicId TopicId, bool? IsHidden, bool? IsDeleted)
    : ICommand<UpdateTopicStateResult>;

public record UpdateTopicStateResult(bool Updated);
