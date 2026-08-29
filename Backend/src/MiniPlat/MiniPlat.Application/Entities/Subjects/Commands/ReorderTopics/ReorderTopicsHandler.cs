using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subjects.Commands.ReorderTopics;

public class ReorderTopicsHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository)
    : ICommandHandler<ReorderTopicsCommand, ReorderTopicsResult>
{
    public async Task<ReorderTopicsResult> Handle(ReorderTopicsCommand command, CancellationToken cancellationToken)
    {
        var subject = await subjectsRepository.GetById(command.Id, cancellationToken);

        if (subject is null)
            throw new SubjectNotFoundException(command.Id.ToString());

        if (!subject.CanManage(currentUser))
            throw new ForbiddenException("You may only reorder topics on subjects you teach.");

        // The list has to name every topic exactly once, so a stale or tampered request cannot
        // leave some topics with an order that no longer means anything.
        var submitted = command.OrderedTopicIds.ToHashSet();
        var existing = subject.Topics.Select(topic => topic.Id).ToHashSet();

        if (submitted.Count != command.OrderedTopicIds.Count || !submitted.SetEquals(existing))
            throw new BadRequestException("The order must list each of the subject's topics exactly once.");

        await subjectsRepository.ReorderTopicsAsync(command.Id, command.OrderedTopicIds, cancellationToken);

        return new ReorderTopicsResult(true);
    }
}
