using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateTopicState;

public class UpdateTopicStateHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository)
    : ICommandHandler<UpdateTopicStateCommand, UpdateTopicStateResult>
{
    public async Task<UpdateTopicStateResult> Handle(UpdateTopicStateCommand command,
        CancellationToken cancellationToken)
    {
        if (command.IsHidden is null && command.IsDeleted is null)
            throw new BadRequestException("Provide isHidden, isDeleted, or both.");

        var subject = await subjectsRepository.GetById(command.Id, cancellationToken);

        if (subject is null)
            throw new SubjectNotFoundException(command.Id.ToString());

        if (!subject.CanManage(currentUser))
            throw new ForbiddenException("You may only edit topics on subjects you teach.");

        if (subject.Topics.All(topic => topic.Id != command.TopicId))
            throw new TopicNotFoundException(command.TopicId.ToString());

        await subjectsRepository.UpdateTopicStateAsync(
            command.Id, command.TopicId, command.IsHidden, command.IsDeleted, cancellationToken);

        return new UpdateTopicStateResult(true);
    }
}
