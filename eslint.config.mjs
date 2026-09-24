import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

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
    // Düz JS/MJS (k6, Detox, jest/detox config, betikler): Node + CommonJS globalleri.
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.commonjs
      }
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }]
    }
  },
  {
    // k6 betikleri: k6 runtime globalleri.
    files: ["apps/api/load/**/*.js"],
    languageOptions: {
      globals: { __ENV: "readonly", __VU: "readonly", __ITER: "readonly", open: "readonly" }
    }
  },
  {
    // Detox e2e: jest globalleri (device/element/by/expect detox'tan require ediliyor).
    files: ["apps/mobile/e2e/**/*.js"],
    languageOptions: {
      globals: { ...globals.jest }
    }
  },
  {
    // apps/api kendi eslint.config'inde any'yi kapatıyor; lint-staged kökten koştuğu için burada da eşitle.
    files: ["apps/api/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" }
  },
  {
    files: ["apps/mobile/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error"
    }
  },
  {
    // apps/mobile testleri vitest kullanır (describe/it/expect "vitest"tan
    // import edilir) — jest globalleri burada gerekmiyor ve yanlışlıkla
    // import'suz kullanımı maskeleyebilir; bkz. bir altındaki blok (jest
    // globalleri yalnızca mobile DIŞI ts/tsx için, ör. apps/api lint-staged
    // kökten koştuğunda kendi eslint.config'ini atlayabiliyor).
    files: ["**/*.{ts,tsx}"],
    ignores: ["apps/mobile/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.browser,
        ...globals.commonjs
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
