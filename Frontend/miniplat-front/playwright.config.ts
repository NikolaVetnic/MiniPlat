import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Four smoke paths through the whole stack: browser -> built frontend -> API -> Postgres.
 *
 * The run starts everything itself, so the only things that have to be in place are Docker
 * and the .NET development certificate (dotnet dev-certs https). The API has to speak
 * https: OpenIddict refuses to issue a token over a plain connection, and in the deployed
 * stack it is nginx that makes the connection https.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const apiProject = path.resolve(here, "../../Backend/src/MiniPlat/MiniPlat.Api");

const DB_PORT = 55432;
const API_PORT = 5199;
const WEB_PORT = 4174;

const API_URL = `https://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

/** The account initialData.yml seeds, and the password the seeder is given for it. */
export const ADMIN = { username: "mp_admin", password: "T3st-admin!password" };

/** USRa teaches Pedagogija and has one subject that is not running. */
export const LECTURER = { username: "USRa", password: "P@ssw0rd!123" };

export default defineConfig({
  testDir: "./e2e",
  // screenshots.spec.ts photographs the README's figures against this same stack. It is
  // not a test, and a smoke run that fails because a caption was reworded would be
  // reporting on the README rather than on the product - so it runs from its own config.
  testIgnore: "**/screenshots.spec.ts",
  // One database, shared between the paths, and the last of them writes to it.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 30_000,
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: WEB_URL,
    // The API runs on the development certificate, which no browser trusts.
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "./e2e/start-api.sh",
      url: `${API_URL}/health`,
      ignoreHTTPSErrors: true,
      // Never reused: the script recreates the database when the API starts, so a reused
      // server would mean the previous run's changes were still there.
      reuseExistingServer: false,
      timeout: 240_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        E2E_API_PROJECT: apiProject,
        E2E_DB_PORT: String(DB_PORT),
        ASPNETCORE_ENVIRONMENT: "Development",
        ASPNETCORE_URLS: API_URL,
        ConnectionStrings__DefaultConnection: `Server=localhost;Port=${DB_PORT};Database=MiniPlatE2E;User Id=postgres;Password=postgres`,
        Seed__FileName: "initialData.yml",
        Seed__AdminUsername: ADMIN.username,
        Seed__AdminPassword: ADMIN.password,
        // The cleanup job would otherwise run a pass against the same database the tests read.
        TopicCleanup__Enabled: "false",
        AllowedOrigins__0: WEB_URL,
        // Without this a real startup failure drowns in one line per query.
        Logging__LogLevel__Default: "Warning",
        // EF warns about query splitting on every subject lookup; that is a performance
        // note about the application, not something this run can say anything about.
        "Logging__LogLevel__Microsoft.EntityFrameworkCore": "Error",
      },
    },
    {
      // The built bundle rather than the dev server: that is the artifact that gets
      // deployed. The build lands outside dist/, so a run does not leave the developer a
      // bundle pointing at an API address that only exists while testing.
      command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        VITE_API_BASE_URL: API_URL,
        VITE_ADMIN_USERNAME: ADMIN.username,
      },
    },
  ],
});
