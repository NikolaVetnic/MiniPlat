using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface ITopicsRepository
{
    Task CreateAsync(Topic topic, CancellationToken cancellationToken);
    Task<Topic> GetById(TopicId topicId, CancellationToken cancellationToken);
    Task<List<Topic>> ListAsync(int pageIndex, int pageSize, CancellationToken cancellationToken);
    Task MarkAsDeletedAsync(TopicId topicId, CancellationToken cancellationToken);
}
