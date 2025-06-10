using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Subjects.Commands.DeleteSubject;

internal class DeleteSubjectHandler(ISubjectsRepository subjectRepository) : ICommandHandler<DeleteSubjectCommand, DeleteSubjectResult>
{
    public async Task<DeleteSubjectResult> Handle(DeleteSubjectCommand command, CancellationToken cancellationToken)
    {
        var subject = await subjectRepository.GetById(command.Id, cancellationToken);
        await subjectRepository.DeleteSubjectAsync(subject.Id, cancellationToken);

        return new DeleteSubjectResult(true);
    }
}
