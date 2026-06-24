import { ConfigService } from '@nestjs/config';

import { authenticationConfig } from '../configs/authentication.config';
import { jwtFromCookieExtractor, JwtStrategy } from './jwt.strategy';

describe('jwtFromCookieExtractor', () => {
  it('returns token from configured cookie name', () => {
    const extractor = jwtFromCookieExtractor('access_token');

    expect(
      extractor({
        cookies: { access_token: 'jwt-token' },
      } as never),
    ).toBe('jwt-token');
  });

  it('returns null when cookie is missing', () => {
    const extractor = jwtFromCookieExtractor('access_token');

    expect(extractor({ cookies: {} } as never)).toBeNull();
  });
});

describe('JwtStrategy', () => {
  const authConfig = {
    secret: 'configured-secret',
    expiresIn: '1h',
    cookie: {
      name: 'access_token',
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 3_600_000,
    },
  };

  it('maps jwt payload to UserRequest', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(authConfig),
    } as unknown as ConfigService;

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

  it('loads authentication config from config service', () => {
    const getOrThrow = jest.fn().mockReturnValue(authConfig);
    const configService = { getOrThrow } as unknown as ConfigService;

    new JwtStrategy(configService);

    expect(getOrThrow).toHaveBeenCalledWith(authenticationConfig.KEY);
  });
});
