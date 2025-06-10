using MediatR;

namespace MiniPlat.Application.Entities.Subject.Commands.CreateSubject;

internal class CreateSubjectHandler : IRequestHandler<CreateSubjectCommand, CreateSubjectResult>
{
    public async Task<CreateSubjectResult> Handle(CreateSubjectCommand request, CancellationToken cancellationToken)
    {
        var subject = new Domain.Models.Subject
        {
            Title = request.Title,
            Description = request.Description,
            Level = request.Level,
            Year = request.Year,
            Lecturer = request.Lecturer,
            Assistant = request.Assistant
        };

        return new CreateSubjectResult(subject.Id);
    }
}
