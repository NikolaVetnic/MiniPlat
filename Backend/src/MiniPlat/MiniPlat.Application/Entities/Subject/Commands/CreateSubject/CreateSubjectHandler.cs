using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Subject.Commands.CreateSubject;

internal class CreateSubjectHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository) : IRequestHandler<CreateSubjectCommand, CreateSubjectResult>
{
    public async Task<CreateSubjectResult> Handle(CreateSubjectCommand command, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!;
        var subject = command.ToSubject(userId);
        await subjectsRepository.CreateSubjectAsync(subject, cancellationToken);

        return new CreateSubjectResult(subject.Id);
    }
}

internal static class CreateSubjectCommandExtensions
{
    public static Domain.Models.Subject ToSubject(this CreateSubjectCommand command, string userId)
    {
        return Domain.Models.Subject.Create(
            SubjectId.Of(Guid.NewGuid()),
            command.Title,
            command.Description,
            command.Code,
            command.Level,
            command.Year,
            command.Lecturer,
            command.Assistant,
            userId
        );
    }
}
