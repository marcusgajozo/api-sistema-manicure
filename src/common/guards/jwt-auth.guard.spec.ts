import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createMockExecutionContext } from '@test/helpers/execution-context.helper';

import { JwtAuthGuard } from './jwt-auth.guard';

type PassportCanActivate = {
  canActivate: (context: unknown) => Promise<boolean>;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let parentProto: PassportCanActivate;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    parentProto = Object.getPrototypeOf(
      JwtAuthGuard.prototype,
    ) as PassportCanActivate;
  });

  it('allows access to public routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superSpy = jest.spyOn(parentProto, 'canActivate');

    const result = await guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
    expect(superSpy).not.toHaveBeenCalled();
  });

  it('delegates to passport guard when route is not public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(true);

    const result = await guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
  });

  it('returns user from handleRequest when authentication succeeds', () => {
    const user = { userId: 'user-id', email: 'user@example.com' };

    expect(guard.handleRequest(null, user)).toEqual(user);
  });

  it('throws UnauthorizedException when user is missing', () => {
    expect(() => {
      guard.handleRequest(null, null);
    }).toThrow(UnauthorizedException);
  });

  it('rethrows authentication errors', () => {
    const error = new Error('jwt malformed');

    expect(() => {
      guard.handleRequest(error, null);
    }).toThrow(error);
  });
});
