using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Infrastructure;
using MiniPlat.Infrastructure.Repositories;

namespace MiniPlat.IntegrationTests.Infrastructure;

/// <summary>
/// A test against the empty database. Each one starts from nothing, so a count or an ordering
/// can be asserted outright.
///
/// Every repository call gets its own DbContext, the way a request would: reusing one would let
/// the change tracker answer a read from memory and hide whatever the database actually stored.
/// </summary>
[Collection(MiniPlatCollection.Name)]
public abstract class RepositoryTestBase(MiniPlatFixture fixture) : Xunit.IAsyncLifetime
{
    protected MiniPlatFixture Fixture { get; } = fixture;

    public Task InitializeAsync() => Fixture.ResetRepositoryDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    protected AppDbContext NewDbContext(ICurrentUser? currentUser = null) => Fixture.NewDbContext(currentUser);

    /// <summary>A repository over a DbContext of its own, which the caller disposes with it.</summary>
    protected (SubjectsRepository Repository, AppDbContext Context) NewSubjects(ICurrentUser? currentUser = null)
    {
        var context = NewDbContext(currentUser);

        return (new SubjectsRepository(context), context);
    }

    protected async Task Store(params Subject[] subjects)
    {
        await using var context = NewDbContext();

        context.Subjects.AddRange(subjects);
        await context.SaveChangesAsync();
    }

    protected async Task<Subject> Reload(SubjectId id)
    {
        await using var context = NewDbContext();

        return await new SubjectsRepository(context).GetById(id, CancellationToken.None);
    }
}
