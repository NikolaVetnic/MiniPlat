using Microsoft.EntityFrameworkCore;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Infrastructure.Repositories;

public class LecturersRepository(AppDbContext appDbContext) : ILecturersRepository
{
    public async Task CreateLecturerAsync(Lecturer lecturer, CancellationToken cancellationToken)
    {
        appDbContext.Lecturers.Add(lecturer);
        await appDbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Lecturer> GetLecturerByUserId(string userId, CancellationToken cancellationToken)
    {
        return await appDbContext.Lecturers
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken) ??
               throw new LecturerNotFoundException(userId);
    }
}