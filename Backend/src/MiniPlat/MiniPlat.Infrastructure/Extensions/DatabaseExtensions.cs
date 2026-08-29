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

        await services.SeedRolesAsync();
        await services.SeedUsersAsync();
        await services.SeedAdminRoleAsync();
        await services.SeedLecturersAsync();
        await services.SeedSubjectsAsync();
    }

    private static string AdminUsername(IConfiguration config) =>
        config["Seed:AdminUsername"] is { Length: > 0 } name ? name : "mp_admin";

    private static async Task SeedRolesAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        if (await roleManager.RoleExistsAsync(Roles.Admin))
            return;

        var result = await roleManager.CreateAsync(new IdentityRole(Roles.Admin));

        if (!result.Succeeded)
            throw new InvalidOperationException(
                $"Seeding role {Roles.Admin} failed: {string.Join("; ", result.Errors.Select(e => e.Description))}");
    }

    /// <summary>
    /// Grants the admin role to the configured admin account. Runs separately from user
    /// seeding so that an account created before roles existed still gets the role.
    /// </summary>
    private static async Task SeedAdminRoleAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var username = AdminUsername(config);
        var admin = await userManager.FindByNameAsync(username);

        if (admin is null)
        {
            Console.WriteLine($"Admin user '{username}' not found; skipping role assignment.");
            return;
        }

        if (await userManager.IsInRoleAsync(admin, Roles.Admin))
            return;

        var result = await userManager.AddToRoleAsync(admin, Roles.Admin);

        if (!result.Succeeded)
            throw new InvalidOperationException(
                $"Granting {Roles.Admin} to {username} failed: {string.Join("; ", result.Errors.Select(e => e.Description))}");
    }

    private static async Task SeedUsersAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var adminPasswordFromConfig = config["Seed:AdminPassword"];
        var fileName = config["Seed:FileName"] ?? "initialData.yml";

        foreach (var seededUser in InitialDataLoader.Load(fileName).SeededUsers)
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

            var passwordToUse = seededUser.Username == AdminUsername(config) && !string.IsNullOrWhiteSpace(adminPasswordFromConfig)
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
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        var fileName = config["Seed:FileName"] ?? "initialData.yml";

        foreach (var seededLecturer in InitialDataLoader.Load(fileName).SeededLecturers)
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
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        var fileName = config["Seed:FileName"] ?? "initialData.yml";

        foreach (var seededSubject in InitialDataLoader.Load(fileName).SeededSubjects)
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
                Semester = seededSubject.Semester,
                Order = seededSubject.Order,
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
                }).ToList(),
                IsActive = seededSubject.IsActive
            };

            await context.Subjects.AddAsync(subject);
        }

        await context.SaveChangesAsync();
    }
}