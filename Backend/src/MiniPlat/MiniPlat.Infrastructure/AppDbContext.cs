using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Infrastructure;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    IEnumerable<ISaveChangesInterceptor> saveChangesInterceptors)
    : IdentityDbContext<ApplicationUser, IdentityRole, string>(options)
{
    private readonly IEnumerable<ISaveChangesInterceptor> _saveChangesInterceptors = saveChangesInterceptors;

    public DbSet<Lecturer> Lecturers { get; set; } = null!; 
    public DbSet<Subject> Subjects { get; set; } = null!;
    public DbSet<Topic> Topics { get; set; } = null!;
    public DbSet<Material> Materials { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        foreach (var interceptor in _saveChangesInterceptors)
        {
            optionsBuilder.AddInterceptors(interceptor);
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        builder.UseOpenIddict();

        // Value converters for strongly-typed IDs
        var lecturerIdConverter = new ValueConverter<LecturerId, Guid>(
            id => id.Value,
            value => LecturerId.Of(value)
        );

        var subjectIdConverter = new ValueConverter<SubjectId, Guid>(
            id => id.Value,
            value => SubjectId.Of(value)
        );

        var topicIdConverter = new ValueConverter<TopicId, Guid>(
            id => id.Value,
            value => TopicId.Of(value)
        );

        var materialIdConverter = new ValueConverter<MaterialId, Guid>(
            id => id.Value,
            value => MaterialId.Of(value)
        );

        // Lecturer
        builder.Entity<Lecturer>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.Property(l => l.Id)
                .HasConversion(lecturerIdConverter)
                .ValueGeneratedNever();

            entity.HasOne(l => l.User)
                .WithOne()
                .HasForeignKey<Lecturer>(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(l => l.UserId)
                .IsRequired();
        });

        // Subject
        builder.Entity<Subject>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.Id)
                .HasConversion(subjectIdConverter)
                .ValueGeneratedNever();

            entity.Property(s => s.Lecturer)
                .IsRequired();

            entity.Property(s => s.Assistant)
                .IsRequired();

            // One-to-many: Subject ➡️ Topics
            entity.HasMany(s => s.Topics)
                  .WithOne()
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Topic
        builder.Entity<Topic>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Id)
                .HasConversion(topicIdConverter)
                .ValueGeneratedNever();

            entity.Property(t => t.Title)
                .IsRequired();

            entity.Property(t => t.Description)
                .IsRequired();

            // One-to-many: Topic ➡️ Materials
            entity.HasMany(t => t.Materials)
                  .WithOne()
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Material
        builder.Entity<Material>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.Property(m => m.Id)
                .HasConversion(materialIdConverter)
                .ValueGeneratedNever();

            entity.Property(m => m.Description)
                .IsRequired();

            entity.Property(m => m.Link)
                .IsRequired();
        });
    }
}