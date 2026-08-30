# CLAUDE.md — the frontend

Read [the repository root's CLAUDE.md](../../CLAUDE.md) first for commands, secrets and
commit conventions. This file covers the React app.

## The rules that shape everything

**Only `src/services/` talks to the API.** Components and pages call a service function;
they never reach for `fetch`, never build a URL, never read a token. Every service reads
`import.meta.env.VITE_API_BASE_URL` (empty in the deployed stack, where nginx serves
same-origin `/api` paths), attaches `authHeaders()`, and calls `dropSessionIfRejected` on a
failure so a token the server has stopped accepting ends the session everywhere at once.

**The API contract is hand-written.** `src/types/api.ts` mirrors the backend's responses and
is not generated from anything. A backend shape that changes has to be edited here by hand —
`npm run typecheck` will not tell you it drifted, because both sides compile fine against a
lie. `src/types/app.ts` holds what is the client's own, `SessionUser` and friends.

**No user-facing string is written in a component.** Captions come from
`useI18n().t`, backed by `src/locales/{sr,no,en}.json`. Adding a caption means adding it to
all three files *and* to the `Dictionary` shape in `src/i18n/types.ts` — `dictionaries.test.ts`
compares key paths across the locales and fails the build on a missing one. Placeholders are
`{name}`, filled by `format()` from `src/i18n/dictionaries.ts`.

## Layout

```
src/services/     the only modules that talk to the API; one file per area, plus session,
                  authHeaders, unauthorized, downloadYaml
src/contexts/     UserContext — who is signed in
src/i18n/         I18nContext, the Dictionary shape, dictionary loading, the Guide renderer
src/locales/      sr.json, no.json, en.json — the only place captions live
src/hooks/        useLecturers, useSubjectPeople, useWindowWidth
src/components/   one folder per component: Component.tsx, Component.module.css, Component.test.tsx
src/pages/        Home, Login, Subject, NotFound
src/utils/        pure helpers — drafts, safeLink, formatDate, footerText
src/types/        api.ts (the contract) and app.ts (the client's own)
src/test/         the test rig; imported only from test files, so none of it reaches the bundle
e2e/             Playwright smoke paths, and the spec that regenerates the README screenshots
```

## Components

Function components with typed props, CSS Modules beside the file (`Component.module.css`),
`react-icons` for iconography. The two contexts are consumed through their hooks:

- `useI18n()` — defaulted, so a component rendered outside the provider still has captions.
  Only switching languages needs the provider.
- `useUser()` — throws outside `UserProvider`, deliberately. It reads the session through
  `useSyncExternalStore`, which is what lets a service drop the session from outside the
  tree and have the UI follow.

The home page splits its body by audience — `Content_Public`, `Content_Lecturers`,
`Content_Admin` — rather than threading conditionals through one tree.

Who counts as the administrator is `VITE_ADMIN_USERNAME`, read at module scope. The tests
pin it in `vite.config.ts` so they exercise the same rule on every machine.

## Tests

Vitest with jsdom, `@testing-library/react`, one `*.test.ts(x)` beside the file it covers.
`describe` names the unit, `it` states the behaviour in a sentence:

```ts
describe("session", () => {
  it("gives an empty session when nothing is stored", async () => { … });
```

The rig in `src/test/`:

- `render.tsx` — `renderWithSession(ui, { route })` wraps the tree in `MemoryRouter`,
  `I18nProvider` and `UserProvider`; `signIn()` / `signOut()` set the real session module,
  so what is exercised is the same path the browser takes rather than a value pushed into a
  context.
- `http.ts` — `installFetch()` plus `urlOf`, `initOf`, `headersOf`, `bodyOf` for reading
  back what was actually sent, and `deferred()` when a test needs to control resolution
  order.
- `fixtures.ts` — sample API payloads.

Modules that read `localStorage` at import (`session`, and anything built on it) need
`vi.resetModules()` and a fresh dynamic `import()` per test, or the in-memory copy carries
over.

**End-to-end** (`e2e/`) is Playwright, and it starts everything itself — a throwaway
Postgres container, the API in Release, a preview server on a bundle built to `dist-e2e/`.
It tests joins, not logic: that the bundle talks to the API that is running, that a token
survives to the next call, that an edit is still there after a reload. Logic belongs in a
unit test. Needs Docker and `dotnet dev-certs https`.

`npm run screenshots` regenerates `docs/screenshots/`; run it when a change alters what the
README shows.

## Style

Two-space indent, double quotes, semicolons, arrow-function components and helpers, `type`
imports as `import type { … }`. `npm run lint` and `npm run typecheck` are both CI gates and
`tsc -b` runs as part of `npm run build`, so a type error fails the build rather than
shipping.
