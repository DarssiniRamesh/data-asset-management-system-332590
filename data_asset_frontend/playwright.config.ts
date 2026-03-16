import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the Asset Configuration BRD flows.
 *
 * Important:
 * - testDir is set to "e2e" so Playwright does NOT try to execute Jest/unit tests under src/**.
 * - Tests rely on existing running services in this workspace:
 *    - Frontend: REACT_APP_FRONTEND_URL (default: http://localhost:3000)
 *    - Backend:  REACT_APP_API_BASE (default: http://localhost:3001)
 */
const frontendBaseURL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";
const backendBaseURL = process.env.REACT_APP_API_BASE || "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: [["line"], ["html", { open: "never" }]],
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  use: {
    baseURL: frontendBaseURL,
    // Use trace/video to help debug flaky E2E + network interactions.
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",

    // Provide backend url for tests that use request context.
    extraHTTPHeaders: {
      "x-e2e-backend-base": backendBaseURL,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
