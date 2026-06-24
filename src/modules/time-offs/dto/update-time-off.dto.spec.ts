import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateTimeOffDto } from './update-time-off.dto';

describe('UpdateTimeOffDto', () => {
  it('accepts an empty payload', async () => {
    const dto = plainToInstance(UpdateTimeOffDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateTimeOffDto, {
      reason: 'Viagem',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty reason when provided', async () => {
    const dto = plainToInstance(UpdateTimeOffDto, {
      reason: '',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });

  it('inherits validation metadata from CreateTimeOffDto with whitelist', async () => {
    const dto = plainToInstance(UpdateTimeOffDto, {
      reason: 'Viagem',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.reason).toBe('Viagem');
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'reason')).toBe(false);
  });
});
