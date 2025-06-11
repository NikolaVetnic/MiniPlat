using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MiniPlat.Domain.Models;

namespace MiniPlat.Infrastructure.Extensions;

public static class DatabaseExtensions
{
    public static async Task MigrateDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var scopedProvider = scope.ServiceProvider;

        var context = scopedProvider.GetRequiredService<AppDbContext>();

        await context.Database.MigrateAsync();
    }

    public static async Task MigrateAndSeedDatabaseAsync(this IServiceProvider services)
    {
        await services.MigrateDatabaseAsync();
        await services.SeedUsersAsync();
        await services.SeedLecturersAsync();
        await services.SeedSubjectsAsync();
        await services.SeedTopicsAsync();
    }

    private static async Task SeedUsersAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var seededUser in InitialData.SeededUsers)
        {
            if (await userManager.FindByNameAsync(seededUser.Username) is not null)
                continue;

            var user = new ApplicationUser
            {
                Id = seededUser.Id,
                UserName = seededUser.Username,
                Email = seededUser.Email,
                FirstName = seededUser.FirstName,
                LastName = seededUser.LastName
            };

            var result = await userManager.CreateAsync(user, seededUser.Password);

            if (result.Succeeded)
                continue;

            var errors = string.Join("; ", result.Errors.Select(e => e.Description));

            throw new InvalidOperationException($"Seeding {seededUser.Username} failed: {errors}");
        }
    }

    private static async Task SeedLecturersAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        foreach (var seededLecturer in InitialData.SeededLecturers)
        {
            if (await context.Lecturers.AnyAsync(l => l.UserId == seededLecturer.UserId))
                continue;

            var lecturer = new Lecturer
            {
                Id = seededLecturer.Id,
                UserId = seededLecturer.UserId,
                Title = seededLecturer.Title,
                Department = seededLecturer.Department,
            };

            await context.Lecturers.AddAsync(lecturer);
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedSubjectsAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        foreach (var seededSubject in InitialData.SeededSubjects)
        {
            if (await context.Subjects.AnyAsync(s =>
                    s.Lecturer == seededSubject.Lecturer || s.Assistant == seededSubject.Assistant))
                continue;

            var subject = new Subject()
            {
                Id = seededSubject.Id,
                Code = seededSubject.Code,
                Title = seededSubject.Title,
                Description = seededSubject.Description,
                Level = seededSubject.Level,
                Year = seededSubject.Year,
                Lecturer = seededSubject.Lecturer,
                Assistant = seededSubject.Assistant
                UserId = seededSubject.UserId,
                TopicIds = seededSubject.TopicIds
            };

            await context.Subjects.AddAsync(subject);
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedTopicsAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        foreach (var seededTopic in InitialData.SeededTopics)
        {
            if (await context.Topics.AnyAsync(s => s.UserId == seededTopic.UserId))
                continue;

            var topic = new Topic()
            {
                Id = seededTopic.Id,
                Title = seededTopic.Title,
                Description = seededTopic.Description,
                isHidden = seededTopic.IsHidden,
                UserId = seededTopic.UserId,
                SubjectId = seededTopic.SubjectId
            };

            await context.Topics.AddAsync(topic);
        }

        await context.SaveChangesAsync();
    }
}