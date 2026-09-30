import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffEsmaEn } from './esma-en-diff.mjs';

const target = { name: { en: 'Al-Alim' }, transliteration: { en: 'Al-Alim' } };

test('ad = harfleştirme ise ikisi de güncellenir', () => {
  const doc = { name: { en: "Al-'Alim" }, transliteration: { en: "Al-'Alim" } };
  assert.deepEqual(diffEsmaEn(doc, target), {
    'transliteration.en': 'Al-Alim',
    'name.en': 'Al-Alim',
  });
});

test('büyük/küçük harf farkıyla eşleşen ad de güncellenir (ALLAH / Allah)', () => {
  const doc = { name: { en: 'Allah (SWT)' }, transliteration: { en: 'ALLAH (SWT)' } };
  const t = { name: { en: 'Allah' }, transliteration: { en: 'Allah' } };
  assert.deepEqual(diffEsmaEn(doc, t), { 'transliteration.en': 'Allah', 'name.en': 'Allah' });
});

test('ad farklıysa dokunulmaz, yalnız harfleştirme güncellenir', () => {
  const doc = { name: { en: 'The Knowing' }, transliteration: { en: "Al-'Alim" } };
  assert.deepEqual(diffEsmaEn(doc, target), { 'transliteration.en': 'Al-Alim' });
});

test('zaten eşitse null (idempotent)', () => {
  const doc = { name: { en: 'Al-Alim' }, transliteration: { en: 'Al-Alim' } };
  assert.equal(diffEsmaEn(doc, target), null);
});
