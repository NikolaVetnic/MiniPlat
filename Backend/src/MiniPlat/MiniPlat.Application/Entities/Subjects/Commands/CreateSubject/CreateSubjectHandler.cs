using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subjects.Commands.CreateSubject;

internal class CreateSubjectHandler(ISubjectsRepository subjectsRepository) : IRequestHandler<CreateSubjectCommand, CreateSubjectResult>
{
    public async Task<CreateSubjectResult> Handle(CreateSubjectCommand command, CancellationToken cancellationToken)
    {
        var subject = command.ToSubject();
        await subjectsRepository.CreateAsync(subject, cancellationToken);

        return new CreateSubjectResult(subject.Id);
    }
}

internal static class CreateSubjectCommandExtensions
{
    public static Subject ToSubject(this CreateSubjectCommand command)
    {
        return Subject.Create(
            SubjectId.Of(Guid.NewGuid()),
            command.Title,
            command.Description,
            command.Code,
            command.Level,
            command.Semester,
            command.Lecturer,
            command.Assistant
        );
    }
}
