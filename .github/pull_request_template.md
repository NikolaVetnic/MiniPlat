## What this changes

<!-- One or two sentences. The commit messages carry the detail; this is the summary a
     reviewer reads first. -->

## Why

<!-- The problem, or the behaviour that was wrong. If the change is not obviously correct
     from the diff, this is where it becomes so. -->

## How it was verified

- [ ] `dotnet build Backend/src/MiniPlat/MiniPlat.sln` and `dotnet test Backend/src/MiniPlat/MiniPlat.sln`
- [ ] `npm run lint && npm run typecheck && npm test` in `Frontend/miniplat-front`
- [ ] `npm run test:e2e` — if a request path, the bundle or the token flow changed
- [ ] `docker compose --env-file .env.template config -q` — if `docker-compose/` changed
- [ ] Ran the stack and looked at it — if the change is visible

<!-- Delete the rows that do not apply. -->

## Anything a reviewer should know

<!-- A migration, a new environment variable, a locale key added to all three files, a
     decision that could reasonably have gone the other way. Otherwise: none. -->
