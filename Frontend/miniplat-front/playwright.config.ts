import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Fire røykstier gjennom hele stakken: nettleser → bygget frontend → API → Postgres.
 *
 * Alt startes av kjøringen selv, så det eneste som må stå klart på forhånd er Docker og
 * .NET-utviklingssertifikatet (dotnet dev-certs https). API-et må snakke https: OpenIddict
 * nekter å utstede et token over en ren forbindelse, og i den utplasserte stakken er det
 * nginx som gjør forbindelsen til https.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const apiProject = path.resolve(here, "../../Backend/src/MiniPlat/MiniPlat.Api");

const DB_PORT = 55432;
const API_PORT = 5199;
const WEB_PORT = 4174;

const API_URL = `https://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

/** Kontoen initialData.yml seeder, og passordet seederen får det med. */
export const ADMIN = { username: "mp_admin", password: "T3st-admin!password" };

/** USRa underviser Pedagogija og har ett emne som ikke er aktivt. */
export const LECTURER = { username: "USRa", password: "P@ssw0rd!123" };

export default defineConfig({
  testDir: "./e2e",
  // Én database, delt mellom stiene, og den siste skriver til den.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 30_000,
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: WEB_URL,
    // API-et kjører på utviklingssertifikatet, som ingen nettleser stoler på.
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
      // Aldri gjenbruk: skriptet lager databasen på nytt når API-et starter, så en
      // gjenbrukt server ville betydd at forrige kjørings endringer fortsatt sto der.
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
        // Ryddejobben ville ellers kjørt en runde mot den samme databasen testene leser.
        TopicCleanup__Enabled: "false",
        AllowedOrigins__0: WEB_URL,
        // Uten dette drukner en ekte oppstartsfeil i én linje per spørring.
        Logging__LogLevel__Default: "Warning",
        // EF advarer om spørringsdeling på hvert emneoppslag; det er en ytelsesnotis om
        // applikasjonen, ikke noe denne kjøringen kan si noe om.
        "Logging__LogLevel__Microsoft.EntityFrameworkCore": "Error",
      },
    },
    {
      // Den bygde pakken, ikke utviklingsserveren: det er artefakten som utplasseres.
      // Bygget havner utenfor dist/, så en kjøring ikke etterlater utvikleren en pakke
      // som peker på en API-adresse som bare finnes under testing.
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
