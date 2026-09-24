/* global element, by, waitFor */
const assert = require('node:assert/strict');
const { freshSignIn, visible, waitForTextContaining, apiSignIn, apiGet } = require('./helpers');

describe('02 sayaç + kayıt + seri', () => {
  beforeAll(async () => {
    await freshSignIn();
  });

  it('5 kez sayar, serbest modda adla kaydeder, seri 1 olur ve log API\'de görünür', async () => {
    await visible('e2e-home-counter');
    for (let i = 0; i < 5; i += 1) {
      await element(by.id('e2e-home-counter')).tap();
    }
    await expect(element(by.id('e2e-home-count-label'))).toHaveText('5');

    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input');
    await element(by.id('e2e-home-save-name-input')).replaceText('E2E Zikir');
    // Seri yalnız tamamlanan (count >= hedef) loglardan sayılır (streaks.service).
    await element(by.id('e2e-home-save-target-input')).replaceText('5');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await waitFor(element(by.id('e2e-home-save-name-input'))).not.toExist().withTimeout(10000);

    // Cihaz dili TR ya da EN olabilir (Android emülatörü EN).
    await waitForTextContaining('e2e-home-streak', /(Seri|Streak) 1 (gün|day)/, 20000);

    const { userId, accessToken } = await apiSignIn();
    const logs = await apiGet('/v1/dhikr-logs', accessToken);
    // Global `expect` Detox'unkidir; düz değerler için node:assert.
    assert.ok(Array.isArray(logs));
    const log = logs.find((item) => item.count === 5);
    assert.ok(log, `count=5 log yok: ${JSON.stringify(logs)}`);
    assert.equal(log.isCompleted, true);

    const streak = await apiGet(`/v1/streaks/${userId}`, accessToken);
    assert.equal(streak.currentStreak, 1);
  });
});
