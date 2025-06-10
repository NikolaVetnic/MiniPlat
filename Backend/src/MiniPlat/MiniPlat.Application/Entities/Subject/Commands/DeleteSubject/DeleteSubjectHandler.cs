using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Subject.Commands.DeleteSubject;

internal class DeleteSubjectHandler(ISubjectsRepository subjectRepository) : ICommandHandler<DeleteSubjectCommand, DeleteSubjectResult>
{
    public async Task<DeleteSubjectResult> Handle(DeleteSubjectCommand command, CancellationToken cancellationToken)
    {
        var subject = await subjectRepository.GetSubjectById(command.Id, cancellationToken);

        await subjectRepository.DeleteSubjectAsync(subject.Id, cancellationToken);

        return new DeleteSubjectResult(true);
    }
}
