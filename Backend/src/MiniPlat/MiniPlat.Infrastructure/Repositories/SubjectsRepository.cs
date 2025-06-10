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
}
