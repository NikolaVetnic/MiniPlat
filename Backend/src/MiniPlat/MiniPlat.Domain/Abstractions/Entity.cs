namespace MiniPlat.Domain.Abstractions;

public abstract class Entity<T> : IEntity<T>
{
    public required T Id { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}