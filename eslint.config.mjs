import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/coverage/**",
      "artifacts/**",
      "docs/**",
      "**/.next/**",
      "**/next-env.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.browser,
        ...globals.commonjs,
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      "no-console": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\buppercase\\b/]",
          message: "className içinde 'uppercase' kullanma: RN'de textTransform cihaz locale'ini kullanıyor (tr cihazda I → İ). useLocaleUpper() hook'unu kullan."
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\buppercase\\b/]",
          message: "className içinde 'uppercase' kullanma: RN'de textTransform cihaz locale'ini kullanıyor (tr cihazda I → İ). useLocaleUpper() hook'unu kullan."
        }
      ]
    }
  }
);
