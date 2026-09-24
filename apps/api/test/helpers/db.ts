import type { Connection } from 'mongoose';

// Prod DB koruması: apps/api/.env gerçek Atlas URI'si içerir (prod DB adı `test`).
// Yalnız yerel host + `zikir_e2e` önekli DB kabul edilir.
export function assertTestMongoUri(uri: string | undefined) {
  if (!uri) {
    throw new Error('[e2e] MONGODB_URI tanımsız.');
  }
  const url = new URL(uri);
  const host = url.hostname;
  const dbName = url.pathname.replace(/^\//, '');
  if (
    url.protocol !== 'mongodb:' ||
    (host !== '127.0.0.1' && host !== 'localhost') ||
    !dbName.startsWith('zikir_e2e')
  ) {
    throw new Error(
      `[e2e] Test DB koruması: ${host}/${dbName} yerel zikir_e2e* DB değil — bağlanma reddedildi.`,
    );
  }
}

function assertTestConnection(connection: Connection) {
  const host = connection.host;
  if (
    (host !== '127.0.0.1' && host !== 'localhost') ||
    !connection.name.startsWith('zikir_e2e')
  ) {
    throw new Error(
      `[e2e] Test DB koruması: ${host}/${connection.name} üzerinde temizlik reddedildi.`,
    );
  }
}

// drop değil deleteMany: indeksler kalsın.
export async function clearCollections(connection: Connection) {
  assertTestConnection(connection);
  const collections = await connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function syncIndexes(connection: Connection) {
  assertTestConnection(connection);
  await Promise.all(
    Object.values(connection.models).map((m) => m.syncIndexes()),
  );
}

export async function dropTestDatabase(connection: Connection) {
  assertTestConnection(connection);
  await connection.dropDatabase();
}
