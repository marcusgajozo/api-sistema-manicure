import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateClientDto } from './update-client.dto';

describe('UpdateClientDto', () => {
  it('accepts an empty payload', async () => {
    const dto = plainToInstance(UpdateClientDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateClientDto, {
      name: 'Maria Santos',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty name when provided', async () => {
    const dto = plainToInstance(UpdateClientDto, {
      name: '',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.NOT_EMPTY');
  });

  it('rejects empty phone when provided', async () => {
    const dto = plainToInstance(UpdateClientDto, {
      phone: '',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'phone', 'validation.NOT_EMPTY');
  });

  it('inherits validation metadata from CreateClientDto with whitelist', async () => {
    const dto = plainToInstance(UpdateClientDto, {
      name: 'Maria Santos',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.name).toBe('Maria Santos');
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });
});
