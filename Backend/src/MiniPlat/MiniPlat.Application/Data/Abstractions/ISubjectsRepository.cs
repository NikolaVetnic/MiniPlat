using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface ISubjectsRepository
{
    Task CreateAsync(Subject subject, CancellationToken cancellationToken);
    Task<Subject> GetById(SubjectId subjectId, CancellationToken cancellationToken);
    Task<List<Subject>> ListAsync(int pageIndex, int pageSize, CancellationToken cancellationToken);
    Task<List<Subject>> ListByUsernameAsync(string username, int pageIndex, int pageSize, CancellationToken cancellationToken);
    Task DeleteSubjectAsync(SubjectId subjectId, CancellationToken cancellationToken);

    Task AddTopic(SubjectId subjectId, TopicId topicId, CancellationToken cancellationToken);
}
