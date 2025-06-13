using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;
using MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

public class UpdateSubjectHandler(ISubjectsRepository subjectsRepository)
    : IRequestHandler<UpdateSubjectCommand, UpdateSubjectResult>
{
    public async Task<UpdateSubjectResult> Handle(UpdateSubjectCommand command, CancellationToken cancellationToken)
    {
        // Retrieve subject with full topic/material graph
        var existingSubject = await subjectsRepository.GetById(command.Id, cancellationToken);

        if (existingSubject is null)
            throw new SubjectNotFoundException(command.Id.ToString());

        // Update scalar fields
        existingSubject.Title = command.Title ?? existingSubject.Title;
        existingSubject.Code = command.Code ?? existingSubject.Code;
        existingSubject.Description = command.Description ?? existingSubject.Description;
        existingSubject.Level = command.Level ?? existingSubject.Level;
        existingSubject.Year = command.Year ?? existingSubject.Year;
        existingSubject.Lecturer = command.Lecturer ?? existingSubject.Lecturer;
        existingSubject.Assistant = command.Assistant ?? existingSubject.Assistant;

        // Update topic/material structure
        if (command.Topics is not null)
        {
            await subjectsRepository.ReplaceTopicsAsync(existingSubject, command.Topics, cancellationToken);
        }
        else
        {
            // Save scalar changes only
            await subjectsRepository.UpdateAsync(existingSubject, cancellationToken);
        }

        return new UpdateSubjectResult(existingSubject);
    }
}