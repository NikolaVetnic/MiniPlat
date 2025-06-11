using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;

namespace MiniPlat.Application.Entities.Topics.Commands.DeleteTopic;

internal class DeleteTopicHandler(ITopicsRepository topicsRepository) : ICommandHandler<DeleteTopicCommand, DeleteTopicResult>
{
    public async Task<DeleteTopicResult> Handle(DeleteTopicCommand request, CancellationToken cancellationToken)
    {
        var topic = await topicsRepository.GetById(request.Id, cancellationToken);
        await topicsRepository.MarkAsDeletedAsync(topic.Id, cancellationToken);

        return new DeleteTopicResult(true);
    }
}
