const { execSync } = require('node:child_process');
const path = require('node:path');
const detoxGlobalSetup = require('detox/runners/jest/globalSetup');

// Test DB'sini her koşuda sıfırla + katalog verisini yükle. API bu DB'ye bağlı
// olmalı (e2e/README.md). e2e-seed.mjs zikir_e2e* dışındaki DB'yi reddeder.
const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true';

module.exports = async (...args) => {
  const run = (cmd) =>
    execSync(cmd, {
      cwd: path.resolve(__dirname, '../../api'),
      env: { ...process.env, MONGODB_URI },
      stdio: 'inherit',
    });
  run('node scripts/e2e-seed.mjs --reset');
  run('node scripts/seed-dhikrs.mjs');
  run('node scripts/seed-vird-templates.mjs');
  await detoxGlobalSetup(...args);
};
