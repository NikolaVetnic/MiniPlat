# CLAUDE.md

Guidance for Claude Code working in this repository.

`README.md` is the tour — what the platform does, why the big decisions were made, how to
run it. This file is the working manual: the commands, the conventions the existing code
already follows, and the traps that are not visible from the file you happen to be editing.

Two more of these sit deeper in the tree and are worth reading before touching either stack:

- [Backend/src/MiniPlat/CLAUDE.md](Backend/src/MiniPlat/CLAUDE.md) — layering, the CQRS slice recipe, migrations, test conventions
- [Frontend/miniplat-front/CLAUDE.md](Frontend/miniplat-front/CLAUDE.md) — services, i18n, component and test conventions

## Ground rules

**Comments stay in code.** This codebase explains itself in place: nearly every non-obvious
line carries a comment saying *why*, not *what*. That is deliberate. Match the density when
adding code, and never relocate an existing comment into a documentation file — the whole
point is that it is read where the decision bites.

**English only** — identifiers, comments, commit messages, test names. The user-facing
strings are the exception: those live in `src/locales/{sr,no,en}.json` and nowhere else.

**Tests are not optional.** Every behaviour change lands with the test that would have
caught the old behaviour. The suites are fast and the split between them is deliberate; see
the two nested `CLAUDE.md` files for which tier a given change belongs in.

**Do not commit or push unless asked.** Branch off `main` when you do.

## Commands

### Backend — .NET 10, from the repository root

```bash
dotnet build Backend/src/MiniPlat/MiniPlat.sln
dotnet test  Backend/src/MiniPlat/MiniPlat.sln                      # both tiers; needs Docker
dotnet test  Backend/src/MiniPlat/MiniPlat.UnitTests                # fast, no I/O, no Docker
dotnet test  Backend/src/MiniPlat/MiniPlat.IntegrationTests         # Testcontainers postgres:17

# one test class, or one test
dotnet test Backend/src/MiniPlat/MiniPlat.UnitTests --filter "FullyQualifiedName~SubjectAccessTests"

# the API, against a local postgres on 4099 — see README "Locally, for development"
dotnet run --project Backend/src/MiniPlat/MiniPlat.Api -lp https    # https://localhost:4101
```

The `-lp https` is not cosmetic: OpenIddict refuses to issue a token over a plain
connection, so the http profile gives a login that cannot succeed.

### Frontend — from `Frontend/miniplat-front`

```bash
npm ci
npm run dev            # http://localhost:4010
npm run lint           # eslint
npm run typecheck      # tsc -b — the build runs this too
npm test               # vitest, single pass
npm run test:watch
npx vitest run src/services/session.test.ts     # one file
npm run test:e2e       # playwright; starts its own postgres + API + preview server
npm run screenshots    # regenerates docs/screenshots/
npm run build
```

CI builds on **Node 20**, matching the `node:20-alpine` image that produces the deployed
bundle. A local Node that is newer will happily pass things CI then rejects.

### The whole stack

```bash
cd docker-compose && ./up.sh      # docker compose up -d --build → https://localhost
cd docker-compose && ./dn.sh      # down
```

First run needs `cp .env.template .env`, every `CHANGE_ME` replaced, and `./gen-certs.sh`.

## Before you call a change done

Backend: `dotnet build` then `dotnet test` on the solution.
Frontend: `npm run lint && npm run typecheck && npm test`.
Compose or nginx: `cd docker-compose && docker compose --env-file .env.template config -q`.

The four CI workflows are path-scoped (`Backend/**`, `Frontend/**`, and so on), so a change
that touches one stack only needs that stack's checks — but a change to `docker-compose/`
or `.github/` triggers `compose.yml`, which validates the compose files against
`.env.template`. Adding a variable to a compose file means adding it to the template too,
or CI fails.

## Configuration and secrets

Nothing secret is in the repository, and several of the absences are enforced rather than
merely intended. Files you may need but will not find, all gitignored:

| File | What it carries |
| --- | --- |
| `Backend/…/MiniPlat.Api/appsettings.override.json` | `Seed:AdminUsername`, `Seed:AdminPassword`, optionally `Seed:FileName` |
| `Frontend/miniplat-front/.env` | `VITE_API_BASE_URL`, `VITE_ADMIN_USERNAME` |
| `docker-compose/.env` | everything `.env.template` names, with real values |
| `docker-compose/certs/` | TLS and the OpenIddict signing/encryption pair, from `gen-certs.sh` |
| `Backend/…/Data/SeedData/actualData.yml` | the real institution's catalogue |

The seeder **refuses to start** without `Seed:AdminPassword` — the fixture's placeholder is
a password Identity rejects, on purpose, so a deployment that skips this step is refused
rather than coming up with credentials that are on GitHub. An API container exiting on
first run is almost always this.

`initialData.yml` is the fictional fixture that ships and is safe to edit; `actualData.yml`
is real data and must never be committed.

## Layout

```
Backend/src/MiniPlat/          .NET solution, four layers plus two test projects
Frontend/miniplat-front/       React 19 + TypeScript + Vite
docker-compose/                the deployable stack, nginx, certificate scripts
docs/screenshots/              generated by `npm run screenshots`, referenced from README
.github/workflows/             backend, frontend, e2e, compose — each path-scoped
```

## Traps

- **`xmin` concurrency.** `Subject.Version` maps to PostgreSQL's system column. A write path
  that drops the caller's version silently reintroduces last-write-wins; a client that does
  not send one back gets no conflict check at all.
- **Forwarded headers.** The API trusts `X-Forwarded-For` from exactly one address
  (`ForwardedHeaders:KnownProxies`). Widening that to the subnet collapses every client into
  a single rate-limit bucket keyed on nginx.
- **Locale parity.** `dictionaries.test.ts` compares key paths across `sr`, `no` and `en`. A
  caption added to one file and forgotten in the others fails the build — which is the
  intent, so fix the other two rather than the test.
- **The API contract is hand-written.** `src/types/api.ts` is not generated. A backend
  response shape that changes has to be mirrored there by hand or the frontend compiles
  against a lie.
- **Postgres is pinned to 17.** The `db_vol` volume was written by 17 and 18 will not open
  it.

## Commits and branches

Every commit message starts with an emoji, then a lowercase summary in the imperative:

| | Used for |
| --- | --- |
| ✨ | a feature, or new tests and workflows |
| 🛠 | a fix, or a behaviour change to something that already worked |
| 🧹 | chores, formatting, reverts |
| 🎨 | styling and visual changes |
| 🔄 | refactors that keep behaviour |
| 📖 | documentation |
| 🖥 | frontend toolchain and type work |

```
✨ add multilingual client interface; add norwegian
🛠 fix subject update deleting every topic
```

Branches are `feat/…`, `docs/…`, `fix/…` off `main`, merged by pull request.
`CONTRIBUTING.md` has the longer version.
