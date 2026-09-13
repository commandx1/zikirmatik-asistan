#!/usr/bin/env node
/* global console, process */
/**
 * Mobil bildirim datasetini (`apps/mobile/src/features/notifications/data/
 * special-days-dataset.ts`) sunucudaki özel gün şablonlarından (SOURCE_DATASETS)
 * üretir. DB BAĞLANTISI YOK — `expandSpecialDays` saf bir fonksiyondur, sadece
 * `data/hijri-calendar.mjs` tablosunu kullanır.
 *
 * Kullanım:
 *   node scripts/gen-special-days-mobile.mjs           # dosyayı yeniden üretir
 *   node scripts/gen-special-days-mobile.mjs --check    # yazmaz; mevcut dosyayla
 *                                                        # karşılaştırır, farklıysa exit 1
 *   pnpm --filter api gen:special-days-mobile           # (aynı komut, kısayol)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { SOURCE_DATASETS } from "./data/sourceDataset.mjs";
import { expandSpecialDays } from "./lib/special-day-seed.mjs";
import { selectMobileNotifications, findSameIdSameDateDuplicates } from "./lib/gen-special-days-mobile.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(
  __dirname,
  "../../mobile/src/features/notifications/data/special-days-dataset.ts"
);
const WINDOW_MONTHS = 18;
const GENERATED_ON_LINE = /^\/\/ Üretim tarihi: \d{4}-\d{2}-\d{2}\.$/m;
const GENERATED_ON_PLACEHOLDER = "// Üretim tarihi: <ignored>.";

export function collectSpecialDayTemplates(sourceDatasets = SOURCE_DATASETS) {
  return sourceDatasets.flatMap((dataset) =>
    Array.isArray(dataset.specialDays) ? dataset.specialDays : []
  );
}

export function buildMobileDataset(now = new Date()) {
  const templates = collectSpecialDayTemplates();
  const { expanded } = expandSpecialDays(templates);
  const { notifications, fromIso, toIso } = selectMobileNotifications(expanded, {
    now,
    windowMonths: WINDOW_MONTHS
  });

  const duplicates = findSameIdSameDateDuplicates(notifications);
  if (duplicates.length > 0) {
    throw new Error(
      `gen-special-days-mobile: aynı id + aynı tarih çakışması bulundu (gerçek kopya kayıt): ${duplicates.join(", ")}`
    );
  }

  return { notifications, fromIso, toIso };
}

function renderNotification(notification, indent) {
  // JSON.stringify(notification, null, 2)'nin her satırını `indent` kadar
  // öteler — nihai dosyanın array öğesi girintisiyle eşleşir.
  const json = JSON.stringify(notification, null, 2);
  return json
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

export function renderMobileDatasetFile({ notifications, fromIso, toIso }, generatedOnIso) {
  const first = notifications[0]?.date ?? fromIso;
  const last = notifications[notifications.length - 1]?.date ?? toIso;
  const body = notifications.map((n) => renderNotification(n, "  ")).join(",\n");

  return `// ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
// \`pnpm --filter api gen:special-days-mobile\` ile yeniden üretin
// (kaynak: apps/api/scripts/gen-special-days-mobile.mjs + SOURCE_DATASETS).
// Tarihler sunucudaki \`date\` alanıyla BİREBİR aynıdır (Diyanet kuralı: akşamı
// geceyi başlatan gün — kandiller "gece" ilkesiyle hesaplanır; ör. Mevlid
// Kandili 1448 → 2026-08-24).
// Kapsam: ${first} → ${last} (üretim penceresi ${fromIso} → ${toIso}, ${WINDOW_MONTHS} ay).
// Üretim tarihi: ${generatedOnIso}.
// \`id\` alanı sunucudaki \`eventKey\` ile birebir aynıdır; bildirim tıklaması
// \`/special-days/<eventKey>\` deep-link'i ile detay ekranını açar. Not: Kurban
// Bayramı arefe günü ve 1. günü AYNI eventKey'i paylaşır (aynı sunucu olayına
// bağlıdır) — bu kasıtlıdır: tüketici (event-notifications.ts) tarihe göre
// gruplar, id'nin dizi genelinde tekil olmasına dayanmaz (bkz.
// scripts/lib/gen-special-days-mobile.test.mjs).

export type LocalizedName = { tr: string; en: string };

export type SpecialDayNotification = {
  /** Kararlı benzersiz anahtar (eventKey). */
  id: string;
  /** ISO tarih "YYYY-MM-DD" (yerel gün). */
  date: string;
  type: "kandil" | "ramazan" | "bayram" | "özel gün";
  name: LocalizedName;
};

export const SPECIAL_DAY_NOTIFICATIONS: readonly SpecialDayNotification[] = [
${body}
] as const;
`;
}

function normalizeForCompare(content) {
  return content.replace(GENERATED_ON_LINE, GENERATED_ON_PLACEHOLDER);
}

function printReport(notifications) {
  console.log(`gen-special-days-mobile: ${notifications.length} başlık bildirim.`);
  for (const n of notifications) {
    console.log(`  ${n.date}  ${n.id}  [${n.type}]  ${n.name.tr}`);
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const now = new Date();
  const dataset = buildMobileDataset(now);
  const generatedOnIso = now.toISOString().slice(0, 10);
  const content = renderMobileDatasetFile(dataset, generatedOnIso);

  printReport(dataset.notifications);

  if (checkOnly) {
    if (!existsSync(OUTPUT_PATH)) {
      console.error(`gen-special-days-mobile --check: dosya bulunamadı: ${OUTPUT_PATH}`);
      process.exitCode = 1;
      return;
    }
    const existing = readFileSync(OUTPUT_PATH, "utf8");
    if (normalizeForCompare(existing) !== normalizeForCompare(content)) {
      console.error(
        "gen-special-days-mobile --check: dosya güncel DEĞİL. `pnpm --filter api gen:special-days-mobile` çalıştırıp yeniden commit edin."
      );
      process.exitCode = 1;
      return;
    }
    console.log("gen-special-days-mobile --check: dosya güncel.");
    return;
  }

  writeFileSync(OUTPUT_PATH, content, "utf8");
  console.log(`gen-special-days-mobile: yazıldı → ${OUTPUT_PATH}`);
}

// Sadece doğrudan `node gen-special-days-mobile.mjs` ile çalıştırıldığında
// main()'i tetikler — başka bir modülün (örn. testlerin) export'ları import
// etmesi yan etkisiz kalır (dosyaya YAZMAZ).
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
