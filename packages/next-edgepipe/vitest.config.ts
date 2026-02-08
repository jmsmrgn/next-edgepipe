import { defineConfig } from "vitest/config";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["src/**/*.test.ts"],
    resolve: {
      alias: {
        "next/server": require.resolve(
          "next/dist/server/web/exports/index.js"
        ),
      },
    },
  },
});
