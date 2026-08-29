using BuildingBlocks.Application.Exceptions;
using MediatR;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subjects.Commands.UpdateSubject;

public class UpdateSubjectHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository)
    : IRequestHandler<UpdateSubjectCommand, UpdateSubjectResult>
{
    public async Task<UpdateSubjectResult> Handle(UpdateSubjectCommand command, CancellationToken cancellationToken)
    {
        // Retrieve subject with full topic/material graph
        var existingSubject = await subjectsRepository.GetById(command.Id, cancellationToken);

        if (existingSubject is null)
            throw new SubjectNotFoundException(command.Id.ToString());

        if (!currentUser.IsAdmin)
        {
            var username = currentUser.Username;

            if (string.IsNullOrEmpty(username) ||
                (existingSubject.Lecturer != username && existingSubject.Assistant != username))
                throw new ForbiddenException("You may only edit subjects you teach.");

            if (command.Lecturer is not null && command.Lecturer != existingSubject.Lecturer)
                throw new ForbiddenException("Only an administrator may change the lecturer of a subject.");

            if (command.Assistant is not null && command.Assistant != existingSubject.Assistant)
                throw new ForbiddenException("Only an administrator may change the assistant of a subject.");
        }

        // Update scalar fields
        existingSubject.Title = command.Title ?? existingSubject.Title;
        existingSubject.Code = command.Code ?? existingSubject.Code;
        existingSubject.Description = command.Description ?? existingSubject.Description;
        existingSubject.Level = command.Level ?? existingSubject.Level;
        existingSubject.Semester = command.Semester ?? existingSubject.Semester;
        existingSubject.Order = command.Order ?? existingSubject.Order;
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
