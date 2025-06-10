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

        var lecturerIdConverter = new ValueConverter<LecturerId, Guid>(
            id => id.Value,
            value => LecturerId.Of(value)
        );

        var subjectIdConverter = new ValueConverter<SubjectId, Guid>(
            id => id.Value,
            value => SubjectId.Of(value)
        );

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

        builder.Entity<Subject>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.Id)
                .HasConversion(subjectIdConverter)
                .ValueGeneratedNever();

            entity.Property(l => l.UserId)
                .IsRequired();
        });
    }
}
