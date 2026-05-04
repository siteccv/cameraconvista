import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup/vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
