const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  existsText,
  openTab,
  seed,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
} = require('./helpers');

const ymd = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

describe('14 istatistik: kaynak dağılımı', () => {
  it('halka katkısı kaynak dağılımında "Halka" olarak görünür', async () => {
    await freshSignIn();
    seed('--premium e2e-user');
    const me = await apiSignIn();
    const host = await apiSignInAs('e2e-host-stats', 'Kurucu');
    const d = await apiGet('/v1/dhikrs', host.accessToken);
    const dhikrId = (Array.isArray(d) ? d : d.items)[0]._id;
    const circle = await apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount: 100, name: 'Istatistik Halkasi' });
    await apiPost('/v1/circles/join', me.accessToken, { code: circle.code });
    await apiPost('/v1/dhikr-logs', me.accessToken, {
      userId: me.userId,
      dhikrId,
      count: 7,
      targetCount: 100,
      date: ymd(),
      source: 'circle',
      circleId: circle.id,
      isCompleted: false,
    });

    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await openTab('stats');
    await existsText(/.*(Halka|Circle).*/, 30000);
  });
});
