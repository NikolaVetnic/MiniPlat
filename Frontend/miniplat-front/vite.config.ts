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
    // safeLink leser window.location og session bruker localStorage, så testene
    // trenger et DOM selv om modulene de dekker ellers er ren logikk.
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    // SubjectCard og Sidebar leser administratornavnet ved import, og det kommer fra
    // en gitignorert .env - altså noe hver maskin har sin egen verdi av, og CI ingen.
    // Pinnet her, så testene prøver den samme regelen overalt.
    env: {
      VITE_ADMIN_USERNAME: "mp_admin",
    },
  },
});
