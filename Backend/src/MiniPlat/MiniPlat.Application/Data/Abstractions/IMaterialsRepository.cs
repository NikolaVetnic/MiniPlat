using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Data.Abstractions;

public interface IMaterialsRepository
{
    Task CreateAsync(Material material, CancellationToken cancellationToken);
}
