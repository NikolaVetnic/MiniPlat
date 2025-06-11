using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Data.Abstractions;

public interface ITopicsRepository
{
    Task CreateAsync(Topic topic, CancellationToken cancellationToken);
}
