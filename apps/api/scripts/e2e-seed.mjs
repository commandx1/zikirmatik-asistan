/**
 * Mobil Detox e2e için yerel test DB'sini hazırlar. Yalnız adı `zikir_e2e`
 * ile başlayan DB'lere yazar (prod = Atlas `test` DB → reddedilir).
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true \
 *     node scripts/e2e-seed.mjs --reset              # tüm koleksiyonları boşalt
 *     node scripts/e2e-seed.mjs --premium e2e-user   # o provider sub'lı kullanıcıyı premium yap
 *
 * `.env` bilerek OKUNMAZ: MONGODB_URI süreç env'inden açıkça verilmeli.
 */
import mongoose from 'mongoose';

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const premiumIdx = args.indexOf('--premium');
const premiumSub = premiumIdx >= 0 ? args[premiumIdx + 1] : undefined;

if (!reset && premiumIdx < 0) {
  console.error('Kullanım: e2e-seed.mjs [--reset] [--premium <providerUserId>]');
  process.exit(1);
}
if (premiumIdx >= 0 && !premiumSub) throw new Error('--premium bir providerUserId ister.');

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error('MONGODB_URI verilmedi.');

await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
try {
  const db = mongoose.connection.db;
  if (!db.databaseName.startsWith('zikir_e2e')) {
    throw new Error(`Güvenlik: DB adı "${db.databaseName}" zikir_e2e ile başlamıyor; yazılmadı.`);
  }

  if (reset) {
    const collections = await db.collections();
    for (const c of collections) await c.deleteMany({});
    console.log(`[e2e-seed] ${db.databaseName}: ${collections.length} koleksiyon boşaltıldı.`);
  }

  if (premiumSub) {
    const identity = await db.collection('auth_identities').findOne({ providerUserId: premiumSub });
    if (!identity) throw new Error(`auth_identities'te providerUserId=${premiumSub} yok (önce giriş yapılmalı).`);
    const now = new Date();
    // Mutabakat cron'u aktif abonelik olmadan isPremium'u geri düşürür → abonelik de yaz.
    await db.collection('subscriptions').updateOne(
      { userId: identity.userId, productId: 'e2e-premium' },
      {
        $set: {
          plan: 'premium',
          provider: identity.provider,
          status: 'active',
          startDate: now,
          endDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    await db.collection('users').updateOne({ _id: identity.userId }, { $set: { isPremium: true } });
    console.log(`[e2e-seed] ${premiumSub} premium yapıldı.`);
  }
} finally {
  await mongoose.disconnect();
}
