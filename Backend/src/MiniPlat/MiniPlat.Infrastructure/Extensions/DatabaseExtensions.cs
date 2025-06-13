using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

        var data = InitialDataLoader.Load();

        await services.SeedUsersAsync();
        await services.SeedLecturersAsync();
        await services.SeedSubjectsAsync();
    }

    private static async Task SeedUsersAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var adminPasswordFromConfig = config["Seed:AdminPassword"];

        foreach (var seededUser in InitialDataLoader.Load().SeededUsers)
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

            var passwordToUse = seededUser.Username == "mp_admin" && !string.IsNullOrWhiteSpace(adminPasswordFromConfig)
                ? adminPasswordFromConfig
                : seededUser.Password;

            var result = await userManager.CreateAsync(user, passwordToUse);

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

        foreach (var seededLecturer in InitialDataLoader.Load().SeededLecturers)
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

        foreach (var seededSubject in InitialDataLoader.Load().SeededSubjects)
        {
            if (await context.Subjects.AnyAsync(s => s.Id == seededSubject.Id))
                continue;

            var subject = new Subject
            {
                Id = seededSubject.Id,
                Code = seededSubject.Code,
                Title = seededSubject.Title,
                Description = seededSubject.Description,
                Level = seededSubject.Level,
                Year = seededSubject.Year,
                Lecturer = seededSubject.Lecturer,
                Assistant = seededSubject.Assistant,
                Topics = seededSubject.Topics.Select(t => new Topic
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Order = t.Order,
                    Materials = t.Materials.Select(m => new Material
                    {
                        Id = m.Id,
                        Description = m.Description,
                        Link = m.Link,
                        Order = m.Order
                    }).ToList()
                }).ToList()
            };

            await context.Subjects.AddAsync(subject);
        }

        await context.SaveChangesAsync();
    }
}