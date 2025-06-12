using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface IMaterialsRepository
{
    Task CreateAsync(Material material, CancellationToken cancellationToken);
    Task<Material> GetById(MaterialId materialId, CancellationToken cancellationToken);
}
