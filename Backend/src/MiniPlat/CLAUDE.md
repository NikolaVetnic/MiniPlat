# CLAUDE.md — the backend

Read [the repository root's CLAUDE.md](../../../CLAUDE.md) first for commands, secrets and
commit conventions. This file covers the solution itself.

## The rule that shapes everything

Dependencies point inward, and the compiler enforces it:

```
Api  ──►  Application  ──►  Domain
                ▲               ▲
                └── Infrastructure ──┘
Api  ┄┄►  Infrastructure     (composition root only — Program.cs)
```

- **Domain** references nothing but Identity's stores. Entities, value objects, strongly
  typed ids. No EF, no MediatR, no ASP.NET.
- **Application** declares what it needs as an abstraction — `ISubjectsRepository`,
  `ICurrentUser`, `ITokenService` in `Data/Abstractions/` — and never names a `DbContext`.
  This is what keeps the unit tier honest: every handler is a class with constructor
  dependencies that a test can substitute, so business rules are exercised without a
  database.
- **Infrastructure** supplies those abstractions. EF Core, migrations, repositories,
  OpenIddict stores, seeding, background services.
- **Api** is controllers, policies, rate limiting, model binding, and the wiring.

If a handler needs a `DbContext`, the abstraction is missing — add it to
`Data/Abstractions/` and implement it in `Infrastructure/Repositories/`. Do not reach
through.

## Adding a use case — the vertical slice

Handlers are found by assembly scanning (`AddMediatR` over the Application assembly), and
validators by `AddValidatorsFromAssembly`, so nothing below needs registering by hand.

One folder per use case under `Entities/<Aggregate>/{Commands,Queries}/<Name>/`, holding
two files:

1. `<Name>Command.cs` — the command or query, its `record …Result`, and the
   `AbstractValidator<T>` if there is one. All three in the file; that is the existing shape.
2. `<Name>Handler.cs` — a primary-constructor class implementing `ICommandHandler<,>` or
   `IQueryHandler<,>` (`Cqrs/`), which are thin markers over MediatR's `IRequestHandler`.

Then in `Api/Controllers/<Aggregate>/`:

3. A request DTO in `…Request.cs` with a `ToCommand()`, a response in `…Responses.cs`.
4. An action on the controller: `[ProducesResponseType]` for each status it can answer, and
   an authorization attribute — `[AllowAnonymous]`, `[Authorize(AuthenticationSchemes =
   OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]`, or
   `[Authorize(Policy = AuthorizationPolicies.Admin)]`. The controller maps and delegates;
   it holds no logic.

Finally the tests: a handler test in `MiniPlat.UnitTests/Application/…`, and an endpoint
test in `MiniPlat.IntegrationTests/Api/…` if the slice touches the database.

**Partial updates carry no defaults.** `null` means "leave this alone". An initialiser on an
optional field is indistinguishable from a value the caller sent — that is what once made an
update with no `topics` key delete every topic on the subject.

## Errors

Handlers throw; nothing maps status codes by hand. `CustomExceptionHandler` turns each
exception into a `ProblemDetails` response:

| Throw | Answer |
| --- | --- |
| `BadRequestException`, FluentValidation's `ValidationException` | 400 (validation failures ride along in a `ValidationErrors` extension) |
| `ForbiddenException` | 403 — authenticated, but not allowed *this* resource |
| `NotFoundException` and its subclasses | 404 |
| `ConcurrencyException` | 409 |
| `InternalServerException`, anything else | 500 |

The base types live in `Application/Exceptions/Base/` under the `BuildingBlocks.Application.Exceptions`
namespace (`NotFoundException` is the exception — it is in `MiniPlat.Application.Exceptions`).
Per-aggregate subclasses sit beside them: `SubjectNotFoundException`, `TopicNotFoundException`.

## Authorization

Two levels, and they answer differently:

- **Policy** (`AuthorizationPolicies.Admin`) — the request never reaches a handler; 401/403
  from the framework.
- **Ownership** — `subject.CanManage(currentUser)` in `Entities/Subjects/SubjectAccess.cs`,
  the single definition of "this subject is mine", used by both the read and write paths.
  `Redact()` is its read-side twin: it strips hidden and soft-deleted topics for anyone who
  may not manage the subject.

A new rule about who may see or change what belongs in `SubjectAccess`, not inlined in a
handler.

## The database

Migrations are in `MiniPlat.Infrastructure/Migrations/`; `AppDbContext` is at the
Infrastructure root, and the API migrates and seeds itself at startup
(`MigrateAndSeedDatabaseAsync`, called from `Program.cs`).

```bash
dotnet tool install -g dotnet-ef      # once

dotnet ef migrations add <Name> \
  --project        Backend/src/MiniPlat/MiniPlat.Infrastructure \
  --startup-project Backend/src/MiniPlat/MiniPlat.Api
```

Run it from the repository root, with a database reachable on the connection string in
`appsettings.json`. `AppDbContextModelSnapshot.cs` changes with every migration and belongs
in the same commit.

`Subject.Version` maps to PostgreSQL's `xmin` — no column, no trigger. A stale save raises
`DbUpdateConcurrencyException` in the repository, which becomes a `ConcurrencyException`
and a 409.

Soft delete is a flag plus `DeletedAt`; `DeletedTopicCleanupService` purges what has been
marked longer than `TopicCleanup:RetentionDays`.

## Tests

**Unit** (`MiniPlat.UnitTests`) — xUnit and NSubstitute, no I/O at all. Names are sentences
with underscores, and they say what the rule is:

```csharp
[Fact]
public void The_assistant_may_manage_the_subject_they_assist_on()
{
    var subject = Some.Subject(lecturer: "ana", assistant: "bob");

    Assert.True(subject.CanManage(FakeCurrentUser.Named("bob")));
}
```

`TestSupport/` holds the rig: `Some` builds entities with every field defaulted so a test
names only the part it is about, `FakeCurrentUser` has `Admin`, `Named` and `Anonymous`,
`TestUserManager` stands in for Identity.

**Integration** (`MiniPlat.IntegrationTests`) — a real `postgres:17` through Testcontainers,
so Docker has to be running. `Infrastructure/` holds the fixtures: `MiniPlatFixture` and
`RepositoryTestBase` for repositories, `MiniPlatApiFactory` and `ApiTestBase` for endpoints
end to end, `Wire` and `HttpExtensions` for the request helpers.

Which tier: a rule about *who may do what*, or *what a validator rejects*, is a unit test —
it should not need a database to be reached. Mapping, the topic/material graph, and status
codes over the wire are integration tests.

## Style

File-scoped namespaces, primary constructors on handlers and controllers, 4-space indent,
Allman braces, `var` where the type is obvious, collection expressions (`[]`). Nullable is
enabled everywhere — leave it that way.
