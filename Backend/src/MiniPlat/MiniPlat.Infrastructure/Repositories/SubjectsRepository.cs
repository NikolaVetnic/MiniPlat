﻿using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure.Repositories;

public class SubjectsRepository(AppDbContext appDbContext) : ISubjectsRepository
{
    public async Task CreateAsync(Subject subject, CancellationToken cancellationToken)
    {
        appDbContext.Subjects.Add(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Subject> GetById(SubjectId subjectId, CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
                   .AsNoTracking()
                   .Include(s => s.Topics.OrderBy(t => t.Order))
                   .ThenInclude(t => t.Materials.OrderBy(m => m.Order))
                   .SingleOrDefaultAsync(x => x.Id == subjectId, cancellationToken) ??
               throw new SubjectNotFoundException(subjectId.ToString());
    }

    public async Task<List<Subject>> ListAsync(int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
            .AsNoTracking()
            .Include(s => s.Topics.OrderBy(t => t.Order))
            .ThenInclude(t => t.Materials.OrderBy(m => m.Order))
            .OrderBy(s => s.Level)
            .ThenBy(s => s.Semester)
            .ThenBy(s => s.Order)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);
    }

    public async Task<List<Subject>> ListByUsernameAsync(string username, int pageIndex, int pageSize,
        CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
            .AsNoTracking()
            .Include(s => s.Topics.OrderBy(t => t.Order))
            .ThenInclude(t => t.Materials.OrderBy(m => m.Order))
            .Where(s => s.Lecturer == username || s.Assistant == username)
            .OrderBy(s => s.Level)
            .ThenBy(s => s.Semester)
            .ThenBy(s => s.Order)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);
    }

    public Task UpdateAsync(Subject subject, CancellationToken cancellationToken)
    {
        appDbContext.Subjects.Update(subject);
        return appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ReplaceTopicsAsync(Subject existingSubject, List<Topic> newTopics,
        CancellationToken cancellationToken)
    {
        appDbContext.Materials.RemoveRange(
            existingSubject.Topics.SelectMany(t => t.Materials)); // Remove existing materials
        appDbContext.Topics.RemoveRange(existingSubject.Topics); // Remove existing topics

        for (var i = 0; i < newTopics.Count; i++) // Reassign topics with proper state
        {
            newTopics[i].Order = i;

            if (newTopics[i].Id.Value == Guid.Empty) // Ensure EF can track them correctly
                appDbContext.Topics.Add(newTopics[i]); // New topic
            else
                appDbContext.Entry(newTopics[i]).State = EntityState.Added; // Treat as new

            foreach (var material in newTopics[i].Materials) // Handle materials inside each topic
                if (material.Id.Value == Guid.Empty)
                    appDbContext.Materials.Add(material);
                else
                    appDbContext.Entry(material).State = EntityState.Added;
        }

        existingSubject.Topics = newTopics; // Replace entire collection

        appDbContext.Entry(existingSubject).State =
            EntityState.Modified; // Only mark Subject as modified (scalar props only)

        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    private void ReplaceMaterials(Topic topic, List<Material> newMaterials)
    {
        var materialMap = topic.Materials.ToDictionary(m => m.Id.Value);

        var updatedMaterials = new List<Material>();

        for (int i = 0; i < newMaterials.Count; i++)
        {
            var newMat = newMaterials[i];

            if (newMat.Id is not null && newMat.Id.Value != Guid.Empty &&
                materialMap.TryGetValue(newMat.Id.Value, out var existingMat))
            {
                existingMat.Description = newMat.Description;
                existingMat.Link = newMat.Link;
                existingMat.Order = i;

                updatedMaterials.Add(existingMat);
            }
            else
            {
                newMat.Id ??= MaterialId.Of(Guid.NewGuid());
                newMat.Order = i;
                updatedMaterials.Add(newMat);
            }
        }

        var newMaterialIds = new HashSet<Guid>(updatedMaterials.Select(m => m.Id!.Value));
        var materialsToRemove = topic.Materials.Where(m => !newMaterialIds.Contains(m.Id.Value)).ToList();

        appDbContext.Materials.RemoveRange(materialsToRemove);

        topic.Materials = updatedMaterials;
    }

    public async Task DeleteSubjectAsync(SubjectId subjectId, CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
            .FirstAsync(s => s.Id == subjectId, cancellationToken);

        appDbContext.Subjects.Remove(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
