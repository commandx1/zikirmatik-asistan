// apps/api tip bilgili kendi ESLint ayarını kullanır; kök ayarla aynı süreçte koşunca
// typescript-eslint tsconfigRootDir çakışması verir → iki ayrı komut.
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');

export default {
  '*.{ts,tsx,js,mjs,cjs}': (files) => {
    const api = files.filter((f) => f.includes('/apps/api/'));
    const rest = files.filter((f) => !f.includes('/apps/api/'));
    return [
      api.length && `eslint --flag v10_config_lookup_from_file --fix ${quote(api)}`,
      rest.length && `eslint --fix ${quote(rest)}`,
    ].filter(Boolean);
  },
};
