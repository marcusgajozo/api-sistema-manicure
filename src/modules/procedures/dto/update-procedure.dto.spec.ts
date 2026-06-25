import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateProcedureDto } from './update-procedure.dto';

describe('UpdateProcedureDto', () => {
  it('accepts an empty payload', async () => {
    const dto = plainToInstance(UpdateProcedureDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateProcedureDto, {
      name: 'Pedicure',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty name when provided', async () => {
    const dto = plainToInstance(UpdateProcedureDto, {
      name: '',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.NOT_EMPTY');
  });

  it('rejects negative price when provided', async () => {
    const dto = plainToInstance(UpdateProcedureDto, {
      price: -10,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'price')).toBe(true);
  });

  it('inherits validation metadata from CreateProcedureDto with whitelist', async () => {
    const dto = plainToInstance(UpdateProcedureDto, {
      name: 'Pedicure',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.name).toBe('Pedicure');
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });
});
