import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalKeyFromArabic } from './canonical-key.mjs';

test('harekeli ve harekesiz aynı metin aynı anahtarı verir', () => {
  const withHarakat = canonicalKeyFromArabic('السَّلَامُ عَلَيْكُمْ');
  const withoutHarakat = canonicalKeyFromArabic('السلام عليكم');
  assert.equal(typeof withHarakat, 'string');
  assert.equal(withHarakat.length, 12);
  assert.equal(withHarakat, withoutHarakat);
});

test('boşluk ve noktalama farkları anahtarı değiştirmez', () => {
  const a = canonicalKeyFromArabic('الحمد لله رب العالمين');
  const b = canonicalKeyFromArabic('  الحمد   لله، رب  العالمين!  ');
  assert.equal(a, b);
});

test('tatweel (kaşide) yok sayılır', () => {
  const a = canonicalKeyFromArabic('اللّٰه');
  const b = canonicalKeyFromArabic('اللّٰـه');
  assert.equal(a, b);
});

test('boş/undefined girişte undefined döner', () => {
  assert.equal(canonicalKeyFromArabic(undefined), undefined);
  assert.equal(canonicalKeyFromArabic(null), undefined);
  assert.equal(canonicalKeyFromArabic(''), undefined);
  assert.equal(canonicalKeyFromArabic('   '), undefined);
});

test('farklı metinler farklı anahtar üretir', () => {
  assert.notEqual(
    canonicalKeyFromArabic('بسم الله الرحمن الرحيم'),
    canonicalKeyFromArabic('الحمد لله رب العالمين'),
  );
});
