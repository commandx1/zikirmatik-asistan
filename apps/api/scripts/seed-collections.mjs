/* global console, process */
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';
import { runCollectionSeed } from './lib/collection-seed.mjs';

runCollectionSeed(SOURCE_DATASETS).catch((err) => {
  console.error('Collection seed başarısız:', err);
  process.exit(1);
});
