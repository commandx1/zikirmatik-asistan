import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: [
        "src/store/**",
        "src/features/**/services/**",
        "src/lib/**",
        "src/services/**",
      ],
      exclude: ["**/*.test.ts", "**/*.d.ts", "**/mocks/**"],
      thresholds: {
        lines: 45,
        branches: 70,
      },
    },
  },
});
