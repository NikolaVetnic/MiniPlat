using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Topics.Queries.GetTopicById;

internal class GetTopicByIdHandler(ITopicsRepository topicsRepository) : IQueryHandler<GetTopicByIdQuery, GetTopicByIdResult>
{
    public async Task<GetTopicByIdResult> Handle(GetTopicByIdQuery query, CancellationToken cancellationToken)
    {
        var topic = await topicsRepository.GetById(query.Id, cancellationToken);

        if (topic == null)
            throw new TopicNotFoundException(query.Id.ToString());

        return new GetTopicByIdResult(topic);
    }
}
