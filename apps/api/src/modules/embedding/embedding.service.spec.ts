import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Binary } from 'mongodb';
import { EmbeddingService } from './embedding.service';

// scripts/lib/embedding.mjs (mjs implementasyonu) ile PAYLAŞILAN fixture.
// Amaç: iki bağımsız implementasyonun (API + script) aynı v3 şablon
// metnini ürettiğini tek bir kaynaktan doğrulamak — bkz.
// scripts/lib/embedding.test.mjs (kardeş test).
const fixturePath = join(
  __dirname,
  '../../../scripts/lib/fixtures/embedding-text.fixture.json',
);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  dhikrs: {
    name: string;
    source: Record<string, unknown>;
    expectedText: string;
  }[];
  passages: {
    name: string;
    source: Record<string, unknown>;
    expectedText: string;
  }[];
};

describe('EmbeddingService.buildSourceText (şablon v3)', () => {
  const service = new EmbeddingService({ get: () => undefined } as never);

  for (const fixtureCase of fixture.dhikrs) {
    it(`fixture: ${fixtureCase.name}`, () => {
      expect(service.buildSourceText(fixtureCase.source as never)).toBe(
        fixtureCase.expectedText,
      );
    });
  }
});

describe('EmbeddingService.toVectorBinary', () => {
  const service = new EmbeddingService({ get: () => undefined } as never);

  it('float32 BSON Binary üretir (subtype 9, dims * 4 byte)', () => {
    const vector = [0.1, -0.25, 0.5, 1, -1, 0.125];
    const binary = service.toVectorBinary(vector);

    expect(binary).toBeInstanceOf(Binary);
    expect(binary.sub_type).toBe(9);
    // BSON vector subtype 9 formatı: 1 byte dtype + 1 byte padding + N*4
    // byte float32 veri.
    expect(binary.buffer.length).toBe(2 + vector.length * 4);

    // Float32'ye yuvarlanmış olsa da orijinal değerlere yakın kalmalı.
    // DataView kullanılır çünkü 2 byte'lık vektör başlığı Float32Array'in
    // gerektirdiği 4-byte hizalamayı bozar.
    const view = new DataView(
      binary.buffer.buffer,
      binary.buffer.byteOffset + 2,
      vector.length * 4,
    );
    vector.forEach((value, index) => {
      expect(view.getFloat32(index * 4, true)).toBeCloseTo(value, 5);
    });
  });
});
