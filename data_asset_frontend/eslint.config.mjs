import pluginJs from "@eslint/js";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettier from "eslint-plugin-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/**
 * ESLint Flat Config (ESLint v9+).
 *
 * Notes:
 * - CRA still ships its own ESLint integration via `react-scripts`, but having a repo-level
 *   `eslint.config.mjs` enables consistent CLI linting in CI and locally (`npm run lint`).
 */
export default [
  // Ignore generated/build artifacts
  {
    ignores: ["build/**", "coverage/**", "node_modules/**"],
  },

  // Base JS/JSX file targeting
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        document: true,
        window: true,
        test: true,
        expect: true,
      },
    },
  },

  // TypeScript/TSX file targeting
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        document: true,
        window: true,
        test: true,
        expect: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Defer to TypeScript for unused vars in TS files to avoid false positives.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // JS recommended rules
  pluginJs.configs.recommended,

  // React + ecosystem rules
  {
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      prettier: pluginPrettier,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      /**
       * React 17+ JSX transform means React import isn't required.
       */
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      /**
       * Hook rules (important for correctness).
       */
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      /**
       * Accessibility baseline.
       * Keep this conservative to avoid overwhelming legacy markup.
       */
      "jsx-a11y/anchor-is-valid": "warn",

      /**
       * Formatting enforcement via Prettier.
       * If a more permissive posture is desired, downgrade to "warn".
       */
      "prettier/prettier": "error",
    },
  },
];
