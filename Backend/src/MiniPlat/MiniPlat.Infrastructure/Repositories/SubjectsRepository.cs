using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure.Repositories;

public class SubjectsRepository(AppDbContext appDbContext) : ISubjectsRepository
{
    public async Task CreateSubjectAsync(Subject subject, CancellationToken cancellationToken)
    {
        appDbContext.Subjects.Add(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Subject> GetSubjectById(SubjectId subjectId, CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.Id == subjectId, cancellationToken) ??
               throw new SubjectNotFoundException(subjectId.ToString());
    }

    public async Task<List<Subject>> ListSubjectsAsync(int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
            .AsNoTracking()
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync(cancellationToken: cancellationToken);
    }

    public async Task DeleteSubjectAsync(SubjectId subjectId, CancellationToken cancellationToken)
    {
        var subject = await appDbContext.Subjects
            .FirstAsync(s => s.Id == subjectId, cancellationToken);

        appDbContext.Subjects.Remove(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }
}
