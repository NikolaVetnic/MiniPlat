using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Infrastructure.Repositories;

public class TopicsRepository(AppDbContext appDbContext) : ITopicsRepository
{
    public async Task CreateAsync(Topic topic, CancellationToken cancellationToken)
    {
        appDbContext.Topics.Add(topic);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
