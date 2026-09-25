/** @type {import('@jest/types').Config.InitialOptions} */
// Promo video kayıt spec'leri için ayrı config: normal `pnpm test:detox:ios`
// e2e/jest.config.js'teki testPathIgnorePatterns nedeniyle bu klasörü atlar.
// apps/promo-video/scripts/record.mjs bu config'i açıkça kullanır.
module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/e2e/recordings/**/*.e2e.js'],
  testTimeout: 180000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/e2e/global-setup.js',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
