using System.Linq.Expressions;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Subjects;

/// <summary>
/// Who is asking, in the terms the subject queries care about.
/// </summary>
public record SubjectViewer(string? Username, bool IsAdmin)
{
    public static SubjectViewer For(ICurrentUser user) => new(user.Username, user.IsAdmin);

    /// <summary>
    /// A subject is visible when it is running, or when the viewer is the one responsible for it.
    /// Held as an expression so the database filters on it and pagination counts the same rows the
    /// caller gets back - an in-memory filter would leave the total counting invisible subjects.
    /// </summary>
    public Expression<Func<Subject, bool>> CanSee =>
        subject => subject.IsActive ||
                   IsAdmin ||
                   (Username != null && (subject.Lecturer == Username || subject.Assistant == Username));
}
