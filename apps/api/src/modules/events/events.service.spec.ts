import { Types } from 'mongoose';
import { MAX_EVENTS_PER_REQUEST } from './dto/track-events.dto';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const appEventModel = {
    insertMany: jest.fn(),
  };

  let service: EventsService;
  const userId = new Types.ObjectId().toHexString();

  beforeEach(() => {
    appEventModel.insertMany.mockReset();
    appEventModel.insertMany.mockImplementation((docs: unknown[]) =>
      Promise.resolve(docs),
    );

    service = new EventsService(appEventModel as never);
  });

  function isoNow() {
    return new Date().toISOString();
  }

  function tooManyProps() {
    const props: Record<string, number> = {};
    for (let i = 0; i < 21; i += 1) {
      props[`k${i}`] = i;
    }
    return props;
  }

  function getInsertedDocs() {
    const calls = appEventModel.insertMany.mock.calls as unknown[][];
    const [docs] = calls[0] ?? [];
    return docs as Array<Record<string, unknown>>;
  }

  it('writes only the valid events from a mixed batch and skips the rest', async () => {
    const result = await service.track({
      deviceId: 'device-1234',
      events: [
        { name: 'dhikr_completed', ts: isoNow(), props: { count: 33 } }, // valid
        { name: 'BAD NAME', ts: isoNow() }, // invalid: name regex
        { name: 'missing_ts' }, // invalid: ts missing
        { name: 'bad_ts', ts: 'not-a-date' }, // invalid: ts not parseable
        { name: 'too_many_props', ts: isoNow(), props: tooManyProps() }, // invalid: >20 keys
        { name: 'long_prop', ts: isoNow(), props: { note: 'a'.repeat(201) } }, // invalid: string too long
        { name: 'bad_prop_type', ts: isoNow(), props: { nested: { a: 1 } } }, // invalid: nested value
        { name: 'array_props', ts: isoNow(), props: [1, 2, 3] }, // invalid: props is an array
        'not-an-object', // invalid: not an object at all
        42, // invalid: not an object at all
      ],
    });

    expect(result).toEqual({ accepted: 1 });
    expect(appEventModel.insertMany).toHaveBeenCalledTimes(1);
    expect(appEventModel.insertMany).toHaveBeenCalledWith(expect.any(Array), {
      ordered: false,
    });

    const docs = getInsertedDocs();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      deviceId: 'device-1234',
      name: 'dhikr_completed',
      props: { count: 33 },
    });
    expect(docs[0].userId).toBeUndefined();
  });

  it('attaches userId to every inserted doc when a valid authenticated caller id is provided', async () => {
    await service.track(
      {
        deviceId: 'device-1234',
        events: [{ name: 'app_opened', ts: isoNow() }],
      },
      userId,
    );

    const docs = getInsertedDocs();
    expect(docs[0].userId).toEqual(new Types.ObjectId(userId));
  });

  it('does not attach userId for guests (no auth token)', async () => {
    await service.track({
      deviceId: 'device-1234',
      events: [{ name: 'app_opened', ts: isoNow() }],
    });

    const docs = getInsertedDocs();
    expect(docs[0].userId).toBeUndefined();
  });

  it('ignores a malformed caller id instead of writing it', async () => {
    await service.track(
      {
        deviceId: 'device-1234',
        events: [{ name: 'app_opened', ts: isoNow() }],
      },
      'not-an-object-id',
    );

    const docs = getInsertedDocs();
    expect(docs[0].userId).toBeUndefined();
  });

  it('caps a request at MAX_EVENTS_PER_REQUEST even when more are sent', async () => {
    const events = Array.from({ length: MAX_EVENTS_PER_REQUEST + 10 }, () => ({
      name: 'app_opened',
      ts: isoNow(),
    }));

    const result = await service.track({ deviceId: 'device-1234', events });

    expect(result).toEqual({ accepted: MAX_EVENTS_PER_REQUEST });
    expect(getInsertedDocs()).toHaveLength(MAX_EVENTS_PER_REQUEST);
  });

  it('returns accepted:0 and skips the insertMany call when every event is invalid', async () => {
    const result = await service.track({
      deviceId: 'device-1234',
      events: [{ name: 'BAD NAME', ts: isoNow() }],
    });

    expect(result).toEqual({ accepted: 0 });
    expect(appEventModel.insertMany).not.toHaveBeenCalled();
  });

  it('reports the partially inserted count when insertMany rejects (ordered:false partial failure)', async () => {
    appEventModel.insertMany.mockRejectedValue(
      Object.assign(new Error('bulk write error'), {
        insertedDocs: [{ name: 'app_opened' }],
      }),
    );

    const result = await service.track({
      deviceId: 'device-1234',
      events: [
        { name: 'app_opened', ts: isoNow() },
        { name: 'dhikr_completed', ts: isoNow() },
      ],
    });

    expect(result).toEqual({ accepted: 1 });
  });

  it('returns accepted:0 when insertMany rejects without reportable partial-insert details', async () => {
    appEventModel.insertMany.mockRejectedValue(new Error('connection lost'));

    const result = await service.track({
      deviceId: 'device-1234',
      events: [{ name: 'app_opened', ts: isoNow() }],
    });

    expect(result).toEqual({ accepted: 0 });
  });
});
