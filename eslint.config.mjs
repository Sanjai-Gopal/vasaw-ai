import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.js",
    "*.cjs",
    "*.mjs",
    "generated-websites/**",
    "scratch/**",
    "scripts/**",
    "tests/**",
    "welcomcafe-*/**",
    "nagerkovil-*/**",
    "saravana-*/**",
    "cafe-*/**",
    "kovai-*/**",
    "annapoorna-*/**",
    "sree-*/**",
    "*-*/**",
  ]),
]);

export default eslintConfig;
