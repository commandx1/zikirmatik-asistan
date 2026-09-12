import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTimeOfDay } from './time-of-day.mjs';

test('undefined/null → any', () => {
  assert.deepEqual(normalizeTimeOfDay(undefined), ['any']);
  assert.deepEqual(normalizeTimeOfDay(null), ['any']);
});

test('tek Türkçe string eşlenir', () => {
  assert.deepEqual(normalizeTimeOfDay('sabah'), ['morning']);
  assert.deepEqual(normalizeTimeOfDay('akşam'), ['evening']);
  assert.deepEqual(normalizeTimeOfDay('gece'), ['night']);
  assert.deepEqual(normalizeTimeOfDay('öğle'), ['afternoon']);
});

test('İngilizce değerler de kabul edilir', () => {
  assert.deepEqual(normalizeTimeOfDay('morning'), ['morning']);
  assert.deepEqual(normalizeTimeOfDay('any'), ['any']);
});

test('dizi girişleri dedup edilir', () => {
  assert.deepEqual(normalizeTimeOfDay(['sabah', 'morning']), ['morning']);
  assert.deepEqual(normalizeTimeOfDay(['gece', 'yatsi']), ['night']);
  assert.deepEqual(normalizeTimeOfDay(['aksam']), ['evening']);
});

test('dört vaktin tamamı → any', () => {
  const result = normalizeTimeOfDay(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']);
  assert.deepEqual(result, ['any']);
});

test('çoklu ama eksik vakit sıralı benzersiz döner', () => {
  assert.deepEqual(normalizeTimeOfDay(['gece', 'yatsi', 'aksam']), ['night', 'evening']);
});

test('any diğer değerlerle birlikteyse kısa devre yapar', () => {
  assert.deepEqual(normalizeTimeOfDay(['sabah', 'any']), ['any']);
});

test('bilinmeyen değer hata fırlatır', () => {
  assert.throws(() => normalizeTimeOfDay('öğlen-sonrası'), /Geçersiz timeOfDay/);
});
