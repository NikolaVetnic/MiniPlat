import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

/**
 * The README's figures, shot against the stack playwright.config.ts already knows how to
 * start. Everything is inherited - the API and preview servers, the throwaway database,
 * the teardown that removes it - and only the file being run differs.
 */
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: "**/screenshots.spec.ts",
  // A figure with a stale caption should be noticed, not quietly retried into place.
  retries: 0,
});
