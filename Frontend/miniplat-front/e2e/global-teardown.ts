import { execFileSync } from "node:child_process";

/**
 * Playwright stops the webServer processes itself, but the database runs detached and
 * would otherwise be left standing after the run.
 */
const globalTeardown = (): void => {
  const container = process.env.E2E_DB_CONTAINER ?? "miniplat-e2e-db";

  try {
    execFileSync("docker", ["rm", "-f", container], { stdio: "ignore" });
  } catch {
    // Already gone, or docker is down - neither is worth failing the run over.
  }
};

export default globalTeardown;
