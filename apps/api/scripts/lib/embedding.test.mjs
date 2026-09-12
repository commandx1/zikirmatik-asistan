import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Binary } from 'mongodb';
import {
  buildPassageEmbeddingText,
  buildSourceText,
  toVectorBinary,
} from './embedding.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// src/modules/embedding/embedding.service.spec.ts (jest) ile PAYLAŞILAN
// fixture. Amaç: iki bağımsız implementasyonun (script + API) aynı v3
// şablon metnini ürettiğini tek bir kaynaktan doğrulamak.
const fixturePath = resolve(__dirname, 'fixtures/embedding-text.fixture.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

test('buildSourceText — şablon v3 fixture eşleşmesi', () => {
  for (const fixtureCase of fixture.dhikrs) {
    assert.equal(
      buildSourceText(fixtureCase.source),
      fixtureCase.expectedText,
      `fixture: ${fixtureCase.name}`,
    );
  }
});

test('buildPassageEmbeddingText — fixture eşleşmesi', () => {
  for (const fixtureCase of fixture.passages) {
    assert.equal(
      buildPassageEmbeddingText(fixtureCase.source),
      fixtureCase.expectedText,
      `fixture: ${fixtureCase.name}`,
    );
  }
});

test('toVectorBinary — float32 BSON Binary (subtype 9, dims * 4 byte)', () => {
  const vector = [0.1, -0.25, 0.5, 1, -1, 0.125];
  const binary = toVectorBinary(vector);

  assert.ok(binary instanceof Binary);
  assert.equal(binary.sub_type, 9);
  // BSON vector subtype 9 formatı: 1 byte dtype + 1 byte padding + N*4 byte
  // float32 veri (bkz. https://www.mongodb.com/docs/manual/reference/bson-types/#binary-subtype-9).
  assert.equal(binary.buffer.length, 2 + vector.length * 4);

  // DataView, Float32Array'in aksine hizasız (non-4-byte-aligned) byte
  // offset'lerde de okuyabildiği için 2 byte'lık vektör başlığını atlarken
  // güvenli.
  const view = new DataView(
    binary.buffer.buffer,
    binary.buffer.byteOffset + 2,
    vector.length * 4,
  );
  vector.forEach((value, index) => {
    const readBack = view.getFloat32(index * 4, true);
    assert.ok(
      Math.abs(readBack - value) < 1e-5,
      `index ${index}: ${readBack} !== ${value}`,
    );
  });
});
