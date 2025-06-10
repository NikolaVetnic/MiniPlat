using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Data.Abstractions;

public interface ILecturersRepository
{
    Task CreateLecturerAsync(Lecturer lecturer, CancellationToken cancellationToken);
    Task<Lecturer> GetLecturerByUserId(string userId, CancellationToken cancellationToken);
}