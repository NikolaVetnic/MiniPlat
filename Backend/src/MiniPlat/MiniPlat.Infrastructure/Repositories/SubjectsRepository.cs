using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Infrastructure.Repositories;

public class SubjectsRepository(AppDbContext appDbContext) : ISubjectsRepository
{
    public async Task CreateSubjectAsync(Subject subject, CancellationToken cancellationToken)
    {
        appDbContext.Subjects.Add(subject);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Subject> GetSubjectByUserId(string userId, CancellationToken cancellationToken)
    {
        return await appDbContext.Subjects
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken) ??
               throw new SubjectNotFoundException(userId);
    }
}
