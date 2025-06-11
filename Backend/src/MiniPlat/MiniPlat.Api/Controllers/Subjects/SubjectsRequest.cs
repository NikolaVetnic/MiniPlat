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
            Assistant = request.Assistant
        };
    }
}