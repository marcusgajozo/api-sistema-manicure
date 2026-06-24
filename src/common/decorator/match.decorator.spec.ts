import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Match } from './match.decorator';

class PasswordDto {
  password: string;

  @Match('password')
  passwordConfirm: string;
}

describe('Match', () => {
  it('accepts matching values', async () => {
    const dto = plainToInstance(PasswordDto, {
      password: 'password123',
      passwordConfirm: 'password123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects mismatched values', async () => {
    const dto = plainToInstance(PasswordDto, {
      password: 'password123',
      passwordConfirm: 'different-password',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('passwordConfirm');
  });
});
