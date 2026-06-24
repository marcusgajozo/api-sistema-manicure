import {
  AuthenticationConfig,
  authenticationConfigFactory,
} from './authentication.config';

describe('authenticationConfigFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses default values when env vars are missing', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_COOKIE_NAME;
    delete process.env.JWT_COOKIE_SECURE;
    delete process.env.JWT_COOKIE_SAME_SITE;
    delete process.env.JWT_COOKIE_PATH;

    expect(authenticationConfigFactory()).toEqual({
      secret: 'secretKey',
      expiresIn: '1h',
      cookie: {
        name: 'access_token',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3_600_000,
      },
    });
  });

  it('reads authentication settings from environment variables', () => {
    process.env.JWT_SECRET = 'custom-secret';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.JWT_COOKIE_NAME = 'auth_cookie';
    process.env.JWT_COOKIE_SECURE = 'true';
    process.env.JWT_COOKIE_SAME_SITE = 'strict';
    process.env.JWT_COOKIE_PATH = '/api';

    expect(authenticationConfigFactory()).toEqual({
      secret: 'custom-secret',
      expiresIn: '2h',
      cookie: {
        name: 'auth_cookie',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
        maxAge: 7_200_000,
      },
    });
  });

  it('parses numeric expiresIn as seconds', () => {
    process.env.JWT_EXPIRES_IN = '900';

    const config = authenticationConfigFactory() as AuthenticationConfig;

    expect(config.cookie.maxAge).toBe(900_000);
  });
});
