using MiniPlat.Application.Entities.Subjects;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Data.Abstractions;

public interface ISubjectsRepository
{
    Task CreateAsync(Subject subject, CancellationToken cancellationToken);
    Task<Subject> GetById(SubjectId subjectId, CancellationToken cancellationToken);
    Task<(List<Subject> Subjects, long TotalCount)> ListAsync(SubjectViewer viewer, int pageIndex, int pageSize, CancellationToken cancellationToken);
    Task<(List<Subject> Subjects, long TotalCount)> ListByUsernameAsync(SubjectViewer viewer, string username, int pageIndex, int pageSize, CancellationToken cancellationToken);
    Task UpdateAsync(Subject subject, CancellationToken cancellationToken);
    Task ReplaceTopicsAsync(Subject existingSubject, List<Topic> newTopics, CancellationToken cancellationToken);
    Task ReorderTopicsAsync(SubjectId subjectId, IReadOnlyList<TopicId> orderedTopicIds, CancellationToken cancellationToken);
    Task UpdateTopicStateAsync(SubjectId subjectId, TopicId topicId, bool? isHidden, bool? isDeleted, CancellationToken cancellationToken);
    Task UpdateStaffAsync(SubjectId subjectId, string lecturer, string? assistant, CancellationToken cancellationToken);
    Task DeleteSubjectAsync(SubjectId subjectId, CancellationToken cancellationToken);
}
