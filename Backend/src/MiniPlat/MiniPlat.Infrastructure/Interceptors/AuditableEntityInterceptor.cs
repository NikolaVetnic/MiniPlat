using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Abstractions;

namespace MiniPlat.Infrastructure.Interceptors;

public class AuditableEntityInterceptor(ICurrentUser currentUser) : SaveChangesInterceptor
{
    /// <summary>
    /// Who to record against a change. Seeding and migrations run outside any request, so there
    /// is genuinely no user then - "system" says that, rather than blaming a person for it.
    /// </summary>
    private string Actor => currentUser.Username is { Length: > 0 } username ? username : "system";

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
        InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context == null) return;

        context.ChangeTracker.DetectChanges();

        foreach (var entry in context.ChangeTracker.Entries<IEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedBy = Actor;
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            
            var isAdded = entry.State == EntityState.Added;
            var isModified = entry.State == EntityState.Modified;

            if (!isAdded && !isModified && !entry.HasChangedOwnedEntities()) 
                continue;
            
            entry.Entity.LastModifiedBy = Actor;
            entry.Entity.LastModifiedAt = DateTime.UtcNow;
        }
    }
}

public static class Extensions
{
    public static bool HasChangedOwnedEntities(this EntityEntry entry)
    {
        return entry.References.Any(r =>
            r.TargetEntry != null &&
            r.TargetEntry.Metadata.IsOwned() &&
            r.TargetEntry.State is EntityState.Added or EntityState.Modified);
    }
}