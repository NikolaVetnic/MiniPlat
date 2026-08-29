import { execFileSync } from "node:child_process";

/**
 * Playwright stopper webServer-prosessene selv, men databasen kjører løsrevet og ville
 * ellers blitt stående igjen etter kjøringen.
 */
const globalTeardown = (): void => {
  const container = process.env.E2E_DB_CONTAINER ?? "miniplat-e2e-db";

  try {
    execFileSync("docker", ["rm", "-f", container], { stdio: "ignore" });
  } catch {
    // Allerede borte, eller docker er nede - ingen av delene er verdt å feile kjøringen på.
  }
};

export default globalTeardown;
