using BuildingBlocks.Application.Exceptions;
using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subjects.Commands.SetSubjectStaff;

public class SetSubjectStaffHandler(
    ISubjectsRepository subjectsRepository,
    ILecturersRepository lecturersRepository)
    : ICommandHandler<SetSubjectStaffCommand, SetSubjectStaffResult>
{
    public async Task<SetSubjectStaffResult> Handle(SetSubjectStaffCommand command,
        CancellationToken cancellationToken)
    {
        // One representation of "no assistant", so the column never holds an empty string.
        var assistant = string.IsNullOrWhiteSpace(command.Assistant) ? null : command.Assistant;

        if (string.IsNullOrWhiteSpace(command.Lecturer))
            throw new BadRequestException("A subject must have a lecturer.");

        if (assistant == command.Lecturer)
            throw new BadRequestException("The lecturer and the assistant must be different people.");

        var subject = await subjectsRepository.GetById(command.Id, cancellationToken);

        if (subject is null)
            throw new SubjectNotFoundException(command.Id.ToString());

        // Guards against assigning a username nobody has: the subject card would then sit on
        // "loading" forever, because looking that lecturer up returns 404.
        await EnsureLecturerExists(command.Lecturer, cancellationToken);

        if (assistant is not null)
            await EnsureLecturerExists(assistant, cancellationToken);

        await subjectsRepository.UpdateStaffAsync(command.Id, command.Lecturer, assistant, cancellationToken);

        return new SetSubjectStaffResult(true);
    }

    private async Task EnsureLecturerExists(string username, CancellationToken cancellationToken)
    {
        try
        {
            await lecturersRepository.GetLecturerByUsername(username, cancellationToken);
        }
        catch (LecturerNotFoundException)
        {
            throw new BadRequestException($"There is no lecturer with the username '{username}'.");
        }
    }
}
