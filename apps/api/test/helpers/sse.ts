import request from 'supertest';

export type SseEvent = { event: string; data: Record<string, unknown> };

/** supertest: text/event-stream gövdesini ham metin olarak toplar. */
export const rawSse = (req: request.Test) =>
  req.buffer(true).parse((res, cb) => {
    let body = '';
    res.on('data', (chunk: Buffer) => (body += chunk.toString()));
    res.on('end', () => cb(null, body));
  });

/** Ham SSE metnini sıralı `{event, data}` listesine çevirir. */
export function parseSse(raw: string): SseEvent[] {
  return raw
    .split('\n\n')
    .filter((b) => b.trim())
    .map((block) => {
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? '';
      const json = /^data: (.*)$/m.exec(block)?.[1] ?? '{}';
      return { event, data: JSON.parse(json) as Record<string, unknown> };
    });
}
