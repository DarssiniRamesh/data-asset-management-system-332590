import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the Asset Configuration BRD flows.
 *
 * Important:
 * - testDir is set to "e2e" so Playwright does NOT try to execute Jest/unit tests under src/**.
 * - Tests MUST rely on environment-provided URLs (no localhost defaults):
 *    - Frontend: REACT_APP_FRONTEND_URL
 *    - Backend:  REACT_APP_BACKEND_URL (fallback: REACT_APP_API_BASE for back-compat)
 */
function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[playwright] Missing required environment variable ${name}. Refusing to default to localhost.`);
  }
  return value;
}

const frontendBaseURL = requiredEnv(
  "REACT_APP_FRONTEND_URL",
  process.env.REACT_APP_FRONTEND_URL || process.env.PLAYWRIGHT_BASE_URL,
).replace(/\/$/, "");

const backendBaseURL = requiredEnv(
  "REACT_APP_BACKEND_URL",
  process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE,
).replace(/\/$/, "");

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
