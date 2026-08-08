/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { defineConfig, devices } from "@playwright/test";
import path from "path";

export const suite = {
  name: process.env.SUITE_NAME || "suiteTemplate",
  owner: "Jacopo Enrico Marinaccio",
  tags: ["login"],
  baseURL: process.env.BASE_URL || "https://www.saucedemo.com",
  env: {
    USER_1: "standard_user",
    USER_2: "locked_out_user",
    USER_3: "problem_user",
    USER_4: "performance_glitch_user",
    USER_5: "error_user",
    USER_6: "visual_user",
    PASS: "secret_sauce",
  },
};

export default defineConfig({
  reporters: [
    ["list"], // Keeping the existing reporter
    [
      "html",
      {
        outputFolder: path.resolve(
          process.cwd(),
          "playwright-report",
          suite.name,
        ),
        open: "never",
      },
    ], // Adding HTML reporter
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
