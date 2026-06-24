import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRequest } from '@/common/types/user-request';

import {
  AuthenticationConfig,
  authenticationConfig,
} from '../configs/authentication.config';

export function jwtFromCookieExtractor(cookieName: string) {
  return (request: Request): string | null => {
    const cookies = request.cookies as Record<string, string> | undefined;

    return cookies?.[cookieName] ?? null;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const authConfig = configService.getOrThrow<AuthenticationConfig>(
      authenticationConfig.KEY,
    );

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
