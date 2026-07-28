/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';
import { keyMap } from './data/keyMap.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function labelOf(dataset) {
  if (typeof dataset.label === 'string') return dataset.label;
  if (dataset.label && typeof dataset.label === 'object') return dataset.label.tr ?? dataset.label.en ?? dataset.key;
  return dataset.key ?? '(unknown)';
}

const report = {
  totalSpecialDays: 0,
  totalUniqueDhikrKeys: new Set(),
  totalDhikrItems: 0,
  issues: [],
  orphanDhikrItems: [],
  duplicateKeyDefs: new Map(), // key -> [{file, tags, categories, suitableFor}]
};

const globalKeyDefs = new Map(); // key -> [{dataset, tags, categories, suitableFor}]
const globalDhikrByKey = new Map(); // key -> [{dataset, item}]
const globalDefinedKeys = new Set();
const allReferencedKeys = new Set();

// PASS 1: collect ALL dhikrItems across ALL dataset files first (cross-file refs allowed)
for (const dataset of SOURCE_DATASETS) {
  const label = labelOf(dataset);
  const dhikrItems = Array.isArray(dataset.dhikrItems) ? dataset.dhikrItems : [];
  for (const item of dhikrItems) {
    report.totalDhikrItems += 1;
    if (!item.key) {
      report.issues.push({ dataset: label, type: 'dhikrItem-missing-key', detail: JSON.stringify(item.name ?? item).slice(0, 80) });
      continue;
    }
    globalDefinedKeys.add(item.key);
    if (!globalDhikrByKey.has(item.key)) globalDhikrByKey.set(item.key, []);
    globalDhikrByKey.get(item.key).push({ dataset: label, item });

    if (!globalKeyDefs.has(item.key)) globalKeyDefs.set(item.key, []);
    globalKeyDefs.get(item.key).push({
      dataset: label,
      tags: item.tags,
      categories: item.categories,
      suitableFor: item.suitableFor,
    });
  }
}

// PASS 2: walk specialDays, validate required fields + dhikrKeys against GLOBAL defined keys
for (const dataset of SOURCE_DATASETS) {
  const label = labelOf(dataset);
  const specialDays = Array.isArray(dataset.specialDays) ? dataset.specialDays : [];

  if (!Array.isArray(dataset.specialDays) || dataset.specialDays.length === 0) {
    report.issues.push({ dataset: label, type: 'no-specialDays' });
  }

  for (const [i, sd] of specialDays.entries()) {
    report.totalSpecialDays += 1;
    const idLabel = `${label}[${i}] eventKey=${sd.eventKey ?? '?'} date=${sd.date ?? '?'}`;

    if (!sd.eventKey) report.issues.push({ dataset: label, type: 'specialDay-missing-eventKey', item: idLabel });
    if (!sd.type) report.issues.push({ dataset: label, type: 'specialDay-missing-type', item: idLabel });
    if (!sd.date) report.issues.push({ dataset: label, type: 'specialDay-missing-date', item: idLabel });
    const nameTr = typeof sd.name === 'object' ? sd.name?.tr : sd.name;
    const nameEn = typeof sd.name === 'object' ? sd.name?.en : undefined;
    if (!nameTr) report.issues.push({ dataset: label, type: 'specialDay-missing-nameTr', item: idLabel });
    if (typeof sd.name === 'object' && !nameEn) report.issues.push({ dataset: label, type: 'specialDay-missing-nameEn', item: idLabel });

    if (!Array.isArray(sd.dhikrKeys) || sd.dhikrKeys.length === 0) {
      report.issues.push({ dataset: label, type: 'specialDay-empty-dhikrKeys', item: idLabel });
      continue;
    }

    for (const dk of sd.dhikrKeys) {
      report.totalUniqueDhikrKeys.add(dk);
      allReferencedKeys.add(dk);
      if (!globalDefinedKeys.has(dk)) {
        report.issues.push({ dataset: label, type: 'dangling-dhikrKey-no-dhikrItem-anywhere', key: dk, item: idLabel });
      } else {
        const defs = globalDhikrByKey.get(dk);
        for (const { dataset: defDataset, item } of defs) {
          const tags = item.tags;
          const categories = item.categories;
          const suitableFor = item.suitableFor;
          if (!Array.isArray(tags) || tags.length === 0) {
            report.issues.push({ dataset: defDataset, referencedFrom: label, type: 'empty-tags', key: dk });
          }
          if (!Array.isArray(categories) || categories.length === 0) {
            report.issues.push({ dataset: defDataset, referencedFrom: label, type: 'empty-categories', key: dk });
          }
          if (!Array.isArray(suitableFor) || suitableFor.length === 0) {
            report.issues.push({ dataset: defDataset, referencedFrom: label, type: 'empty-suitableFor', key: dk });
          }
          if (!item.name) {
            report.issues.push({ dataset: defDataset, referencedFrom: label, type: 'missing-name', key: dk });
          }
          const hasVirtue = item.virtue || item.meaning || item.fazilet || item.source || item.hadith;
          if (!hasVirtue) {
            report.issues.push({ dataset: defDataset, referencedFrom: label, type: 'missing-virtue-or-meaning-field', key: dk });
          }
        }
      }
    }
  }
}

// keyMap check — only for keys that ARE referenced by some specialDay.dhikrKeys
for (const key of allReferencedKeys) {
  const inKeyMap = Object.values(keyMap).includes(key) || Object.prototype.hasOwnProperty.call(keyMap, key);
  if (!inKeyMap) {
    report.issues.push({ type: 'referenced-key-not-in-keyMap', key });
  }
}

// orphan dhikrItems (defined anywhere but never referenced by ANY specialDay in ANY dataset)
for (const dataset of SOURCE_DATASETS) {
  const label = labelOf(dataset);
  const dhikrItems = Array.isArray(dataset.dhikrItems) ? dataset.dhikrItems : [];
  for (const item of dhikrItems) {
    if (item.key && !allReferencedKeys.has(item.key)) {
      report.orphanDhikrItems.push({ dataset: label, key: item.key });
    }
  }
}

// duplicate key defs across datasets with different tags/categories/suitableFor
for (const [key, defs] of globalKeyDefs.entries()) {
  if (defs.length > 1) {
    const serialized = defs.map((d) => JSON.stringify({ tags: (d.tags ?? []).slice().sort(), categories: (d.categories ?? []).slice().sort(), suitableFor: (d.suitableFor ?? []).slice().sort() }));
    const unique = new Set(serialized);
    if (unique.size > 1) {
      report.duplicateKeyDefs.set(key, defs);
    }
  }
}

// TEKBIR check
const tekbirInKeyMap = Object.prototype.hasOwnProperty.call(keyMap, 'TEKBIR');
const tekbirReferenced = allReferencedKeys.has('TEKBIR');

console.log('=== SUMMARY (pre-DB) ===');
console.log('totalSpecialDays:', report.totalSpecialDays);
console.log('totalUniqueDhikrKeysReferenced:', report.totalUniqueDhikrKeys.size);
console.log('totalDhikrItemsScanned:', report.totalDhikrItems);
console.log('uniqueDhikrItemKeysDefinedGlobally:', globalDefinedKeys.size);
console.log('issuesCount (pre-DB):', report.issues.length);
console.log('TEKBIR in keyMap:', tekbirInKeyMap, '| referenced by any specialDay:', tekbirReferenced);
console.log('');
console.log('=== ISSUES (pre-DB) ===');
for (const issue of report.issues) {
  console.log(JSON.stringify(issue));
}
console.log('');
console.log('=== DUPLICATE KEY DEFS (different tags/categories/suitableFor across files) ===');
for (const [key, defs] of report.duplicateKeyDefs.entries()) {
  console.log(key, JSON.stringify(defs));
}
console.log('');
console.log('=== ORPHAN DHIKR ITEMS (defined, never referenced by any specialDay anywhere) ===');
for (const o of report.orphanDhikrItems) {
  console.log(JSON.stringify(o));
}

// ---- DB phase ----
loadEnvFiles(['apps/api/.env', 'apps/api/.env.local']);
const mongoUri = process.env.MONGODB_URI?.trim();
if (!mongoUri) {
  console.log('\n[UYARI] MONGODB_URI bulunamadı, DB fazı atlanıyor.');
  process.exit(0);
}

const { MongoClient } = await import('mongodb');
const client = new MongoClient(mongoUri);
try {
  await client.connect();
  const db = client.db();
  const dhikrs = db.collection('dhikrs');

  console.log('\n=== DB PHASE ===');
  const dbIssues = [];
  let checkedKeys = 0;
  for (const [key, defs] of globalKeyDefs.entries()) {
    checkedKeys += 1;
    const doc = await dhikrs.findOne({ key });
    if (!doc) {
      dbIssues.push({ type: 'not-in-db', key });
      continue;
    }
    for (const def of defs) {
      const dbTags = (doc.tags ?? []).slice().sort();
      const dbCategories = (doc.categories ?? []).slice().sort();
      const dbSuitableFor = (doc.suitableFor ?? []).slice().sort();
      const fileTags = (def.tags ?? []).slice().sort();
      const fileCategories = (def.categories ?? []).slice().sort();
      const fileSuitableFor = (def.suitableFor ?? []).slice().sort();
      if (JSON.stringify(dbTags) !== JSON.stringify(fileTags)) {
        dbIssues.push({ type: 'tags-mismatch', key, dataset: def.dataset, dbTags, fileTags });
      }
      if (JSON.stringify(dbCategories) !== JSON.stringify(fileCategories)) {
        dbIssues.push({ type: 'categories-mismatch', key, dataset: def.dataset, dbCategories, fileCategories });
      }
      if (JSON.stringify(dbSuitableFor) !== JSON.stringify(fileSuitableFor)) {
        dbIssues.push({ type: 'suitableFor-mismatch', key, dataset: def.dataset, dbSuitableFor, fileSuitableFor });
      }
    }
  }
  console.log('checkedKeysAgainstDb:', checkedKeys);
  console.log('dbIssuesCount:', dbIssues.length);
  for (const issue of dbIssues) {
    console.log(JSON.stringify(issue));
  }
} finally {
  await client.close();
}
