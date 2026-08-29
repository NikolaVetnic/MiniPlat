using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects;

public static class SubjectAccess
{
    /// <summary>
    /// True for an administrator, or for the subject's own lecturer or assistant.
    /// Single definition of "this subject is mine", shared by the read and write paths.
    /// </summary>
    public static bool CanManage(this Subject subject, ICurrentUser user)
    {
        if (user.IsAdmin)
            return true;

        var username = user.Username;

        return !string.IsNullOrEmpty(username) &&
               (subject.Lecturer == username || subject.Assistant == username);
    }

    /// <summary>
    /// Strips hidden and soft-deleted teaching material for anyone who may not manage the
    /// subject, which is what the lecturer handbook promises students never see. Read queries
    /// use AsNoTracking, so trimming these collections cannot reach the database.
    /// </summary>
    public static Subject Redact(this Subject subject, ICurrentUser user)
    {
        if (subject.CanManage(user))
            return subject;

        subject.Topics = subject.Topics
            .Where(topic => topic is { IsHidden: false, IsDeleted: false })
            .ToList();

        foreach (var topic in subject.Topics)
            topic.Materials = topic.Materials
                .Where(material => !material.IsDeleted)
                .ToList();

        return subject;
    }

    public static List<Subject> Redact(this IEnumerable<Subject> subjects, ICurrentUser user) =>
        subjects.Select(subject => subject.Redact(user)).ToList();
}
