using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Entities.Subjects;
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

    public async Task<(List<Subject> Subjects, long TotalCount)> ListAsync(SubjectViewer viewer, int pageIndex,
        int pageSize, CancellationToken cancellationToken)
    {
        var query = appDbContext.Subjects.AsNoTracking().Where(viewer.CanSee);

        // Counted before the Include, so the total costs one cheap query rather than loading
        // every subject's topics and materials just to size the result.
        var totalCount = await query.LongCountAsync(cancellationToken);

        var subjects = await query
            .Include(s => s.Topics.OrderBy(t => t.Order))
            .ThenInclude(t => t.Materials.OrderBy(m => m.Order))
            .OrderBy(s => s.Level)
            .ThenBy(s => s.Semester)
            .ThenBy(s => s.Order)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);

        return (subjects, totalCount);
    }

    public async Task<(List<Subject> Subjects, long TotalCount)> ListByUsernameAsync(SubjectViewer viewer,
        string username, int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        var query = appDbContext.Subjects
            .AsNoTracking()
            .Where(viewer.CanSee)
            .Where(s => s.Lecturer == username || s.Assistant == username);

        var totalCount = await query.LongCountAsync(cancellationToken);

        var subjects = await query
            .Include(s => s.Topics.OrderBy(t => t.Order))
            .ThenInclude(t => t.Materials.OrderBy(m => m.Order))
            .OrderBy(s => s.Level)
            .ThenBy(s => s.Semester)
            .ThenBy(s => s.Order)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);

        return (subjects, totalCount);
    }

    public async Task UpdateAsync(Subject subject, CancellationToken cancellationToken)
    {
        appDbContext.Subjects.Update(subject);
        await SaveDetectingConflicts(cancellationToken);
    }

    /// <summary>
    /// EF raises DbUpdateConcurrencyException when the row's xmin no longer matches the one the
    /// caller sent, meaning someone saved first. Translated here so the Application layer does
    /// not have to know about EF.
    /// </summary>
    private async Task SaveDetectingConflicts(CancellationToken cancellationToken)
    {
        try
        {
            await appDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "This subject was changed by someone else while you were editing it. " +
                "Reload the page and apply your change again.");
        }
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

        await SaveDetectingConflicts(cancellationToken);
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

    /// <summary>
    /// Writes nothing but the Order column of each topic. Tracked rather than AsNoTracking, so
    /// EF emits a plain UPDATE per moved topic instead of tearing down the graph the way
    /// ReplaceTopicsAsync has to.
    /// </summary>
    public async Task ReorderTopicsAsync(SubjectId subjectId, IReadOnlyList<TopicId> orderedTopicIds,
        CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
                          .Include(s => s.Topics)
                          .SingleOrDefaultAsync(s => s.Id == subjectId, cancellationToken) ??
                      throw new SubjectNotFoundException(subjectId.ToString());

        var positions = orderedTopicIds
            .Select((topicId, index) => (topicId, index))
            .ToDictionary(entry => entry.topicId, entry => entry.index);

        foreach (var topic in subject.Topics)
            if (positions.TryGetValue(topic.Id, out var order))
                topic.Order = order;

        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Writes only the flags that were supplied, on one topic. Tracked, so EF emits a single
    /// UPDATE rather than rebuilding the subject's topics and materials.
    /// </summary>
    public async Task UpdateTopicStateAsync(SubjectId subjectId, TopicId topicId, bool? isHidden, bool? isDeleted,
        CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
                          .Include(s => s.Topics)
                          .SingleOrDefaultAsync(s => s.Id == subjectId, cancellationToken) ??
                      throw new SubjectNotFoundException(subjectId.ToString());

        var topic = subject.Topics.SingleOrDefault(t => t.Id.Equals(topicId)) ??
                    throw new TopicNotFoundException(topicId.ToString());

        if (isHidden.HasValue)
            topic.IsHidden = isHidden.Value;

        if (isDeleted.HasValue)
            topic.IsDeleted = isDeleted.Value;

        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Writes the two staff columns and nothing else. Tracked, so the subject's topics and
    /// materials are left where they are instead of being rebuilt to change a name.
    /// </summary>
    public async Task UpdateStaffAsync(SubjectId subjectId, string lecturer, string? assistant,
        CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
                          .SingleOrDefaultAsync(s => s.Id == subjectId, cancellationToken) ??
                      throw new SubjectNotFoundException(subjectId.ToString());

        subject.Lecturer = lecturer;
        subject.Assistant = assistant;

        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteSubjectAsync(SubjectId subjectId, CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
            .FirstAsync(s => s.Id == subjectId, cancellationToken);

        appDbContext.Subjects.Remove(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
