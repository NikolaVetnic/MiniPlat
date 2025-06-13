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

    public async Task<Lecturer> GetLecturerByUsername(string username, CancellationToken cancellationToken)
    {
        return await appDbContext.Lecturers
                   .Include(l => l.User)
                   .AsNoTracking()
                   .SingleOrDefaultAsync(x => x.User.UserName == username, cancellationToken) ??
               throw new LecturerNotFoundException(username);
    }
}