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
        var subject = Subject.Create(
            SubjectId.Of(Guid.NewGuid()),
            command.Title,
            command.Description,
            command.Code,
            command.Level,
            command.Year,
            command.Lecturer,
            command.Assistant
        );

        subject.Topics = command.Topics
            .OrderBy(t => t.Order)
            .Select(t => new Topic
            {
                Id = TopicId.Of(t.Id),
                Title = t.Title,
                Description = t.Description,
                IsHidden = t.IsHidden,
                Materials = t.Materials
                    .OrderBy(m => m.Order)
                    .Select(m => new Material
                    {
                        Id = MaterialId.Of(m.Id),
                        Description = m.Description,
                        Link = m.Link
                    }).ToList()
            }).ToList();

        return subject;
    }
}
