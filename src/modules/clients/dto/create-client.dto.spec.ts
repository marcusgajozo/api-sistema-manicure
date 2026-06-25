import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateClientDto } from './create-client.dto';

function createValidCreateClientDto(
  overrides: Partial<CreateClientDto> = {},
): CreateClientDto {
  return plainToInstance(CreateClientDto, {
    name: 'Maria Silva',
    phone: '11999998888',
    ...overrides,
  });
}

describe('CreateClientDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidCreateClientDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when name is empty', async () => {
    const dto = createValidCreateClientDto({ name: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.NOT_EMPTY');
  });

  it('rejects when name is not a string', async () => {
    const dto = createValidCreateClientDto({
      name: 123 as unknown as string,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'name', 'validation.INVALID_STRING');
  });

  it('rejects when phone is empty', async () => {
    const dto = createValidCreateClientDto({ phone: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'phone', 'validation.NOT_EMPTY');
  });

  it('rejects when phone is not a string', async () => {
    const dto = createValidCreateClientDto({
      phone: 11999998888 as unknown as string,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'phone', 'validation.INVALID_STRING');
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateClientDto, {
      name: 'Maria Silva',
      phone: '11999998888',
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
