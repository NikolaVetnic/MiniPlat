using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Subjects;

public class CreateSubjectRequest
{
    public string Title { get; set; }
    public string Description { get; set; }
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; }
    public string Assistant { get; set; }
}
