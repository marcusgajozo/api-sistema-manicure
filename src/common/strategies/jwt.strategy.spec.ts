import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('maps jwt payload to UserRequest', () => {
    const get = jest.fn().mockReturnValue('test-secret');
    const configService = { get } as unknown as ConfigService;

    const strategy = new JwtStrategy(configService);

    expect(
      strategy.validate({
        sub: 'user-id',
        email: 'user@example.com',
      }),
    ).toEqual({
      userId: 'user-id',
      email: 'user@example.com',
    });
  });

  it('uses JWT_SECRET from config service', () => {
    const get = jest.fn().mockReturnValue('configured-secret');
    const configService = { get } as unknown as ConfigService;

    new JwtStrategy(configService);

    expect(get).toHaveBeenCalledWith('JWT_SECRET', 'secretKey');
  });
});
