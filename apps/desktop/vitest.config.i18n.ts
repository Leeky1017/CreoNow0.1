import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/i18n/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
