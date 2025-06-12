using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Infrastructure.Repositories;

public class MaterialsRepository(AppDbContext appDbContext) : IMaterialsRepository
{
    public async Task CreateAsync(Material material, CancellationToken cancellationToken)
    {
        appDbContext.Materials.Add(material);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
