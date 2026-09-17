import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCircleDto } from './create-circle.dto';
import { JoinCircleDto } from './join-circle.dto';

const dhikrId = '507f1f77bcf86cd799439011';

async function errorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateCircleDto, payload);
  return validate(dto);
}

describe('CreateCircleDto', () => {
  it('rejects goalCount 0', async () => {
    const errors = await errorsFor({ dhikrId, goalCount: 0 });
    expect(errors.some((error) => error.property === 'goalCount')).toBe(true);
  });

  it('rejects goalCount over the 10,000,000 cap', async () => {
    const errors = await errorsFor({ dhikrId, goalCount: 10_000_001 });
    expect(errors.some((error) => error.property === 'goalCount')).toBe(true);
  });

  it('rejects a non-integer goalCount', async () => {
    const errors = await errorsFor({ dhikrId, goalCount: 1.5 });
    expect(errors.some((error) => error.property === 'goalCount')).toBe(true);
  });

  it('rejects an invalid dhikrId', async () => {
    const errors = await errorsFor({ dhikrId: 'abc', goalCount: 1000 });
    expect(errors.some((error) => error.property === 'dhikrId')).toBe(true);
  });

  it('rejects a malformed endDate', async () => {
    const errors = await errorsFor({
      dhikrId,
      goalCount: 1000,
      endDate: '2026-9-1',
    });
    expect(errors.some((error) => error.property === 'endDate')).toBe(true);
  });

  it('rejects a 1-character name', async () => {
    const errors = await errorsFor({ dhikrId, goalCount: 1000, name: 'a' });
    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('accepts a payload with name omitted', async () => {
    const errors = await errorsFor({ dhikrId, goalCount: 1000 });
    expect(errors).toHaveLength(0);
  });
});

describe('JoinCircleDto', () => {
  it('rejects a 7-character code', async () => {
    const dto = plainToInstance(JoinCircleDto, { code: 'ABCDEFG' });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('accepts an 8-character code', async () => {
    const dto = plainToInstance(JoinCircleDto, { code: 'ABCDEFGH' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
