using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Topics.Commands.UpdateTopic;

internal class UpdateTopicHandler(ITopicsRepository topicsRepository) : ICommandHandler<UpdateTopicCommand, UpdateTopicResult>
{
    public async Task<UpdateTopicResult> Handle(UpdateTopicCommand command, CancellationToken cancellationToken)
    {
        var topic = await topicsRepository.GetById(command.Id, cancellationToken);

        topic.Title = command.Title ?? topic.Title;
        topic.Description = command.Description ?? topic.Description;

        await topicsRepository.UpdateTopic(topic, cancellationToken);

        return new UpdateTopicResult(topic);
    }
}
