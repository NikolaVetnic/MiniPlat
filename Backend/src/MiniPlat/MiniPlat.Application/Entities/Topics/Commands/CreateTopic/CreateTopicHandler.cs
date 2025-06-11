using MediatR;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Topics.Commands.CreateTopic;

internal class CreateTopicHandler(ICurrentUser currentUser, ITopicsRepository topicsRepository, ISubjectsRepository subjectRepository) : IRequestHandler<CreateTopicCommand, CreateTopicResult>
{
    public async Task<CreateTopicResult> Handle(CreateTopicCommand command, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!;
        var topic = command.ToTopic(userId);

        await topicsRepository.CreateAsync(topic, cancellationToken);
        await subjectRepository.AddTopic(topic.SubjectId, topic.Id, cancellationToken);

        return new CreateTopicResult(topic.Id);
    }
}

internal static class CreateTopicCommandExtensions
{
    public static Domain.Models.Topic ToTopic(this CreateTopicCommand command, string userId)
    {
        return Domain.Models.Topic.Create(
            Domain.ValueObjects.TopicId.Of(Guid.NewGuid()),
            command.Title,
            command.Description,
            userId,
            command.SubjectId
        );
    }
}