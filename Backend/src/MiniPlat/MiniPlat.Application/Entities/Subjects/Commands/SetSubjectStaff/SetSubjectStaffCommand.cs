using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.SetSubjectStaff;

/// <summary>
/// Assigns the lecturer and assistant of a subject. A null assistant means the subject has none -
/// unambiguous here, unlike on UpdateSubject where null has to mean "leave this field alone" and
/// so cannot express removal at all.
/// </summary>
public record SetSubjectStaffCommand(SubjectId Id, string Lecturer, string? Assistant)
    : ICommand<SetSubjectStaffResult>;

public record SetSubjectStaffResult(bool Updated);
