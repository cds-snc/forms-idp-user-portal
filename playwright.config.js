const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./test/playwright",
  timeout: 30000,
  workers: 1,
  use: {
    headless: true,
    trace: "on-first-retry",
  },
});
