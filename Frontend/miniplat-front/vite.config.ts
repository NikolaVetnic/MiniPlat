import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4010,
    host: true,
  },
  test: {
    // safeLink reads window.location and session uses localStorage, so the tests need a
    // DOM even though the modules they cover are otherwise plain logic.
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    // SubjectCard and Sidebar read the administrator name at import, and it comes from a
    // gitignored .env - something each machine has its own value of, and CI none at all.
    // Pinned here, so the tests exercise the same rule everywhere.
    env: {
      VITE_ADMIN_USERNAME: "mp_admin",
    },
  },
});
