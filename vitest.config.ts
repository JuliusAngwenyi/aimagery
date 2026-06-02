import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: [
            "lib/**/*.test.{ts,tsx}",
            "components/**/*.test.{ts,tsx}",
            "app/**/*.test.tsx",
          ],
        },
      },
      {
        test: {
          name: "api",
          environment: "node",
          include: ["app/**/*.test.ts"],
        },
      },
    ],
  },
});
