import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRequest } from '@/common/types/user-request';

import { authenticationConfig } from '../configs/authentication.config';

export function jwtFromCookieExtractor(cookieName: string) {
  return (request: Request): string | null => {
    const cookies = request.cookies as Record<string, string> | undefined;

    return cookies?.[cookieName] ?? null;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authenticationConfig.KEY)
    authConfig: ConfigType<typeof authenticationConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        jwtFromCookieExtractor(authConfig.cookie.name),
      ]),
      ignoreExpiration: false,
      secretOrKey: authConfig.secret,
    });
  }

  validate(payload: { sub: string; email: string }): UserRequest {
    return { userId: payload.sub, email: payload.email };
  }
}
