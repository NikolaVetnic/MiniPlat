using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure.Repositories;

public class TopicsRepository(AppDbContext appDbContext) : ITopicsRepository
{
    public async Task CreateAsync(Topic topic, CancellationToken cancellationToken)
    {
        appDbContext.Topics.Add(topic);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Topic> GetById(TopicId topicId, CancellationToken cancellationToken)
    {
        return await appDbContext.Topics
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.Id == topicId, cancellationToken) ??
               throw new SubjectNotFoundException(topicId.ToString());
    }

    public async Task<List<Topic>> ListAsync(int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        return await appDbContext.Topics
            .AsNoTracking()
            .Include(t => t.Materials)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);
    }
}
