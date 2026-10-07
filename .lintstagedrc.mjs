// apps/api/{src,test} .ts dosyaları tip bilgili kendi ESLint ayarını kullanır (API lint
// script'inin kapsamı); kök ayarla aynı süreçte koşunca typescript-eslint tsconfigRootDir
// çakışması verir → iki ayrı komut. apps/api/load ve scripts JS'leri kök ayarla denetlenir.
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');

export default {
  '*.{ts,tsx,js,mjs,cjs}': (files) => {
    const isApiTs = (f) => /\/apps\/api\/(src|test)\/.*\.ts$/.test(f);
    const api = files.filter(isApiTs);
    const rest = files.filter((f) => !isApiTs(f));
    return [
      api.length && `eslint --flag v10_config_lookup_from_file --fix ${quote(api)}`,
      rest.length && `eslint --fix ${quote(rest)}`,
    ].filter(Boolean);
  },
};
