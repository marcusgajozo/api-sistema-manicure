import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { SignUpDto } from './sign-up.dto';

function createValidSignUpDto(overrides: Partial<SignUpDto> = {}): SignUpDto {
  return plainToInstance(SignUpDto, {
    name: 'Jane Doe',
    phone: '11999999999',
    email: 'jane@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
    ...overrides,
  });
}

describe('SignUpDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidSignUpDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when name is missing', async () => {
    const dto = createValidSignUpDto({ name: '' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects when phone is missing', async () => {
    const dto = createValidSignUpDto({ phone: '' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects invalid email', async () => {
    const dto = createValidSignUpDto({ email: 'invalid-email' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects when password confirmation does not match', async () => {
    const dto = createValidSignUpDto({ passwordConfirm: 'different-password' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'passwordConfirm')).toBe(
      true,
    );
  });

  it('keeps inherited fields with whitelist enabled', async () => {
    const dto = plainToInstance(SignUpDto, {
      name: 'Jane Doe',
      phone: '11999999999',
      email: 'jane@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
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
