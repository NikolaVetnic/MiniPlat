using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Topics.Commands.DeleteTopic;

internal class DeleteTopicHandler(ITopicsRepository topicsRepository) : ICommandHandler<DeleteTopicCommand, DeleteTopicResult>
{
    public async Task<DeleteTopicResult> Handle(DeleteTopicCommand command, CancellationToken cancellationToken)
    {
        var topic = await topicsRepository.GetById(command.Id, cancellationToken);
        await topicsRepository.MarkAsDeletedAsync(topic.Id, cancellationToken);

        return new DeleteTopicResult(true);
    }
}
