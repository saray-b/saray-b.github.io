import { defineConfig } from "@playwright/test";

// Las pruebas corren contra la versión estática (carpeta out/), igual que en GitHub Pages.
export default defineConfig({
  testDir: "tests",
  use: { baseURL: "http://localhost:4173", channel: process.env.CI ? undefined : "chrome" },
  webServer: { command: "npx serve out -l 4173 --no-clipboard", url: "http://localhost:4173", reuseExistingServer: true },
});
