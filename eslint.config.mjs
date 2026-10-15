import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint 9 flat config.
 *
 * eslint-config-next 16 ships native flat configs, so they are spread directly
 * rather than bridged through FlatCompat — the legacy `extends` route throws on
 * v16 because the config graph is now circular.
 *
 * `src/generated` is Prisma's output and `deploy` is infrastructure; both are
 * excluded rather than linted.
 */
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "deploy/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Underscore-prefixed names are the deliberate "intentionally unused"
      // marker used when destructuring a field away.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
];

export default config;
