namespace MiniPlat.Domain.Models;

public class Subject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; }
    public string Description { get; set; }
    public Level Level { get; set; }
    public int Year { get; set; }
    public string Lecturer { get; set; }
    public string Assistant { get; set; }
}
