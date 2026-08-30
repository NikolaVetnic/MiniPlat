# Contributing

`README.md` explains what MiniPlat is and how to run it. This file is about working on it:
what a change is expected to carry, and the conventions the repository already follows.

## Getting set up

Follow **Running it → Locally, for development** in the README. Three things have to exist
before anything will start, and all three are gitignored:

- `Backend/src/MiniPlat/MiniPlat.Api/appsettings.override.json` with `Seed:AdminUsername`
  and `Seed:AdminPassword` — the seeder refuses to start without a password, on purpose
- `Frontend/miniplat-front/.env` with `VITE_API_BASE_URL` and `VITE_ADMIN_USERNAME`
- a Postgres on port 4099, or the whole stack under `docker-compose/`

You need the .NET 10 SDK, Node 20, and Docker. Node 20 specifically: CI and the deployed
bundle are both built on it, and a newer local runtime will pass things CI then rejects.

## What a change carries

**Tests.** Every behaviour change lands with the test that would have caught the old
behaviour. Which tier depends on what changed:

| Change | Test |
| --- | --- |
| A rule — who may edit, what a validator rejects, what a viewer sees | backend unit (`MiniPlat.UnitTests`) |
| Mapping, the topic graph, a status code over the wire | backend integration (`MiniPlat.IntegrationTests`) |
| A service, hook, or pure helper | `*.test.ts` beside it |
| A component's behaviour | `*.test.tsx`, Testing Library, through `renderWithSession` |
| A join between bundle, API and database | `e2e/` — and only that; logic belongs above |

**Comments where the reasoning is not obvious.** This codebase explains itself in place, and
that is deliberate: a comment saying *why* sits on the line that would otherwise look
arbitrary. Match the density of the file you are in. Do not move an existing comment out of
the code and into a documentation file.

**English, everywhere.** Identifiers, comments, test names, commit messages. The only
strings a reader sees in another language are the captions in `src/locales/`.

**All three locales.** A caption added to `sr.json` and forgotten in `no.json` and `en.json`
fails the build — `dictionaries.test.ts` compares key paths. Add it to `src/i18n/types.ts`
as well, which is what declares the shape.

**Nothing secret.** No password, certificate, `.env`, or real institutional data. If a
change needs a new setting, add it to `docker-compose/.env.template` with a `CHANGE_ME`
value — `compose.yml` in CI validates the compose files against that template, so a
variable missing from it fails.

## Before opening a pull request

```bash
# backend
dotnet build Backend/src/MiniPlat/MiniPlat.sln
dotnet test  Backend/src/MiniPlat/MiniPlat.sln          # needs Docker for the integration tier

# frontend
cd Frontend/miniplat-front
npm run lint && npm run typecheck && npm test

# if a request path, the bundle or the token flow changed
npm run test:e2e

# if docker-compose/ changed
cd docker-compose && docker compose --env-file .env.template config -q
```

A change that alters what the README's screenshots show should regenerate them with
`npm run screenshots`.

## Commits

An emoji, then a lowercase summary in the imperative. One concern per commit — the history
is meant to be readable as a sequence of decisions, which is why the TypeScript migration is
one commit per layer rather than one commit.

| | Used for |
| --- | --- |
| ✨ | a feature, or new tests and workflows |
| 🛠 | a fix, or a behaviour change to something that already worked |
| 🧹 | chores, formatting, reverts |
| 🎨 | styling and visual changes |
| 🔄 | a refactor that keeps behaviour |
| 📖 | documentation |
| 🖥 | frontend toolchain and type work |

```
✨ add multilingual client interface; add norwegian
🛠 fix subject update deleting every topic
🔄 use flag to mark deletion instead of previous entity fields
```

Say what the change does, not what file it touches. `🛠 fix subject update deleting every
topic` is worth reading a year later; `🛠 update handler` is not.

## Branches and pull requests

Branch off `main`, named for the work: `feat/add-other-languages`, `docs/add-proper-readme`,
`fix/…`. Everything reaches `main` through a pull request; the four workflows run on it and
are path-scoped, so a frontend change does not rebuild the solution.

`main` is the deployable branch. Keep it that way.

## Where to read next

- [CLAUDE.md](CLAUDE.md) — the working manual: commands, conventions, and the traps
- [Backend/src/MiniPlat/CLAUDE.md](Backend/src/MiniPlat/CLAUDE.md) — layering and the CQRS slice recipe
- [Frontend/miniplat-front/CLAUDE.md](Frontend/miniplat-front/CLAUDE.md) — services, i18n, components
- **Decisions worth explaining** in the README — why the architecture is what it is
