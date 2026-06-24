import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

function createValidCreateUserDto(
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto {
  return plainToInstance(CreateUserDto, {
    name: 'Jane Doe',
    phone: '11999999999',
    ...overrides,
  });
}

describe('CreateUserDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidCreateUserDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when name is empty', async () => {
    const dto = createValidCreateUserDto({ name: '' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects when phone is empty', async () => {
    const dto = createValidCreateUserDto({ phone: '' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects when name is not a string', async () => {
    const dto = createValidCreateUserDto({ name: 123 as unknown as string });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects when phone is not a string', async () => {
    const dto = createValidCreateUserDto({
      phone: 11999999999 as unknown as string,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Jane Doe',
      phone: '11999999999',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.name).toBe('Jane Doe');
    expect(dto.phone).toBe('11999999999');
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'name')).toBe(false);
    expect(errors.some((error) => error.property === 'phone')).toBe(false);
  });
});
