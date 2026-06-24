import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateTimeOffDto } from './create-time-off.dto';

function createValidCreateTimeOffDto(
  overrides: Partial<CreateTimeOffDto> = {},
): CreateTimeOffDto {
  return plainToInstance(CreateTimeOffDto, {
    startDate: '2026-07-01T09:00:00.000Z',
    endDate: '2026-07-05T18:00:00.000Z',
    reason: 'Férias',
    ...overrides,
  });
}

describe('CreateTimeOffDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidCreateTimeOffDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when startDate is empty', async () => {
    const dto = createValidCreateTimeOffDto({
      startDate: '' as unknown as Date,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'startDate')).toBe(true);
  });

  it('rejects when endDate is empty', async () => {
    const dto = createValidCreateTimeOffDto({ endDate: '' as unknown as Date });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'endDate')).toBe(true);
  });

  it('rejects when reason is empty', async () => {
    const dto = createValidCreateTimeOffDto({ reason: '' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateTimeOffDto, {
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-05T18:00:00.000Z',
      reason: 'Férias',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'reason')).toBe(false);
  });
});
