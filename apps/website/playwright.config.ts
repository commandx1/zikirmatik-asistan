import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 180_000
  }
});
