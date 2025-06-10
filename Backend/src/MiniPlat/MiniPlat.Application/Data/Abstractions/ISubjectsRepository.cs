using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Data.Abstractions;

public interface ISubjectsRepository
{
    Task CreateSubjectAsync(Subject subject, CancellationToken cancellationToken);
    Task<Subject> GetSubjectByUserId(string userId, CancellationToken cancellationToken);
}
