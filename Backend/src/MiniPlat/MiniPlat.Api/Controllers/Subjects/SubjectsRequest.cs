using MiniPlat.Api.Controllers.Topics;
using MiniPlat.Application.Entities.Subjects.Commands.CreateSubject;
using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Subjects;

public class CreateSubjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
    public List<CreateTopicRequest> Topics { get; set; } = [];
}

public static class SubjectRequestExtensions
{
    public static CreateSubjectCommand ToCommand(this CreateSubjectRequest request)
    {
        return new CreateSubjectCommand
        {
            Title = request.Title,
            Code = request.Code,
            Description = request.Description,
            Level = request.Level,
            Year = request.Year,
            Lecturer = request.Lecturer,
            Assistant = request.Assistant,
            Topics = request.Topics.Select(t => new CreateTopicDto
            {
                Id = Guid.NewGuid(), // Generate a new ID for the topic
                Title = t.Title,
                Description = t.Description,
                Materials = t.Materials.Select(m => new CreateMaterialDto
                {
                    Id = Guid.NewGuid(), // Generate a new ID for the material
                    Description = m.Description,
                    Link = m.Link,
                }).ToList()
            }).ToList()
        };
    }
}
