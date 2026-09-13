import base from "../../eslint.config.mjs";

export default [
  ...base,
  {
    ignores: ["**/.next/**", "next-env.d.ts"]
  },
  {
    // Kök yapılandırmadaki `uppercase` yasağı React Native'e özgüdür (cihaz
    // locale'iyle textTransform). Web'de CSS text-transform sayfanın `lang`
    // özniteliğine göre doğru çalışır; bu kural website'de geçersizdir.
    rules: {
      "no-restricted-syntax": "off"
    }
  }
];
