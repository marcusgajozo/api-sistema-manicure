import { ConfigFactory, registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import { CookieOptions } from 'express';

export interface AuthenticationConfig {
  secret: string;
  expiresIn: NonNullable<JwtSignOptions['expiresIn']>;
  cookie: CookieOptions & { name: string };
}

function parseExpiresInToMs(expiresIn: string): number {
  const durationMatch = /^(\d+)([smhd])$/.exec(expiresIn);

  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * multipliers[unit];
  }

  const seconds = parseInt(expiresIn, 10);

  return Number.isNaN(seconds) ? 3_600_000 : seconds * 1000;
}

export const authenticationConfigFactory: ConfigFactory<
  AuthenticationConfig
> = () => {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as NonNullable<
    JwtSignOptions['expiresIn']
  >;
  const sameSite = (process.env.JWT_COOKIE_SAME_SITE ?? 'lax') as
    | 'strict'
    | 'lax'
    | 'none';

  return {
    secret: process.env.JWT_SECRET ?? 'secretKey',
    expiresIn,
    cookie: {
      name: process.env.JWT_COOKIE_NAME ?? 'access_token',
      httpOnly: true,
      secure: process.env.JWT_COOKIE_SECURE === 'true',
      sameSite,
      path: process.env.JWT_COOKIE_PATH ?? '/',
      maxAge: parseExpiresInToMs(String(expiresIn)),
    },
  };
};

export const authenticationConfig = registerAs(
  'authentication',
  authenticationConfigFactory,
);
