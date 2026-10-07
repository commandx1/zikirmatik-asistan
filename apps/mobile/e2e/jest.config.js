/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  // Kayıt (promo video) spec'leri normal suite'in parçası değil — apps/promo-video/scripts/record.mjs
  // bunları ayrı e2e/recordings/jest.config.js ile çalıştırır.
  testPathIgnorePatterns: ['<rootDir>/e2e/recordings/'],
  testTimeout: 300000,
  maxWorkers: 1,
  testSequencer: '<rootDir>/e2e/sequencer.js',
  globalSetup: '<rootDir>/e2e/global-setup.js',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
