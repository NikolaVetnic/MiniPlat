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

    public async Task<List<Material>> ListAsync(int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        return await appDbContext.Materials
            .AsNoTracking()
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);
    }

    public async Task UpdateMaterial(Material material, CancellationToken cancellationToken)
    {
        appDbContext.Materials.Update(material);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteMaterial(MaterialId materialId, CancellationToken cancellationToken)
    {
        var material = await GetById(materialId, cancellationToken);

        appDbContext.Materials.Remove(material);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
