using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface ISubjectsRepository
{
    Task CreateSubjectAsync(Subject subject, CancellationToken cancellationToken);
    Task<Subject> GetSubjectById(SubjectId subjectId, CancellationToken cancellationToken);
}
