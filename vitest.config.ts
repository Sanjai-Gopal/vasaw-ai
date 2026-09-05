import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 180000,
    hookTimeout: 180000,
    fileParallelism: false,
    maxWorkers: 1,
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});