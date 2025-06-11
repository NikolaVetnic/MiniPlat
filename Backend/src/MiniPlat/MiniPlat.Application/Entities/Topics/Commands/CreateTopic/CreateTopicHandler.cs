using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Topics.Commands.CreateTopic;

internal class CreateTopicHandler(ITopicsRepository topicsRepository) : IRequestHandler<CreateTopicCommand, CreateTopicResult>
{
    public async Task<CreateTopicResult> Handle(CreateTopicCommand command, CancellationToken cancellationToken)
    {
        var topic = command.ToTopic();
        await topicsRepository.CreateAsync(topic, cancellationToken);
        return new CreateTopicResult(topic.Id);
    }
}

internal static class CreateTopicCommandExtensions
{
    public static Topic ToTopic(this CreateTopicCommand command)
    {
        return Topic.Create(
            TopicId.Of(Guid.NewGuid()),
            command.Title,
            command.Description
        );
    }
}
