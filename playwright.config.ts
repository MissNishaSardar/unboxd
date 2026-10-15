import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    headless: true,
  },
  projects: [
    {
      name: "smoke",
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: "review",
      testMatch: /review-shots\.spec\.ts/,
    },
  ],
});
