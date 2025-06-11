using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface ITopicsRepository
{
    Task CreateAsync(Topic topic, CancellationToken cancellationToken);
    Task<Topic> GetById(TopicId topicId, CancellationToken cancellationToken);
}
