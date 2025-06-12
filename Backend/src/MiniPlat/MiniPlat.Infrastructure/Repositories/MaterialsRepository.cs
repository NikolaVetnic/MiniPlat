using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure.Repositories;

public class MaterialsRepository(AppDbContext appDbContext) : IMaterialsRepository
{
    public async Task CreateAsync(Material material, CancellationToken cancellationToken)
    {
        appDbContext.Materials.Add(material);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Material> GetById(MaterialId materialId, CancellationToken cancellationToken)
    {
        return await appDbContext.Materials
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.Id == materialId, cancellationToken) ??
               throw new MaterialNotFoundException(materialId.ToString());
    }
}
