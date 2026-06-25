import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateProcedureDto } from './create-procedure.dto';

function createValidCreateProcedureDto(
  overrides: Partial<CreateProcedureDto> = {},
): CreateProcedureDto {
  return plainToInstance(CreateProcedureDto, {
    name: 'Manicure',
    description: 'Manicure completa',
    price: 5000,
    returnDays: 15,
    durationMinutes: 60,
    ...overrides,
  });
}

describe('CreateProcedureDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidCreateProcedureDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts payload without optional fields', async () => {
    const dto = createValidCreateProcedureDto({
      description: undefined,
      durationMinutes: undefined,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when name is empty', async () => {
    const dto = createValidCreateProcedureDto({ name: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.NOT_EMPTY');
  });

  it('rejects when name is not a string', async () => {
    const dto = createValidCreateProcedureDto({
      name: 123 as unknown as string,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.INVALID_STRING');
  });

  it('rejects when price is not an integer', async () => {
    const dto = createValidCreateProcedureDto({ price: 50.5 });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'price', 'validation.INVALID_INT');
  });

  it('rejects negative price', async () => {
    const dto = createValidCreateProcedureDto({ price: -1 });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'price')).toBe(true);
  });

  it('rejects when returnDays is not an integer', async () => {
    const dto = createValidCreateProcedureDto({ returnDays: 1.5 });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'returnDays', 'validation.INVALID_INT');
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateProcedureDto, {
      name: 'Manicure',
      price: 5000,
      returnDays: 15,
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });
});
