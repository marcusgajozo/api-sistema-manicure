import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { createMockExecutionContext } from '@test/helpers/execution-context.helper';

import { UserAuth } from './user-auth.decorator';

function getParamDecoratorFactory(
  decorator: ParameterDecorator,
): (data: unknown, ctx: unknown) => unknown {
  class TestHost {
    handler(@decorator _value: unknown) {
      void _value;
    }
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestHost,
    'handler',
  ) as Record<string, { factory: (data: unknown, ctx: unknown) => unknown }>;

  return Object.values(metadata)[0].factory;
}

describe('UserAuth', () => {
  const factory = getParamDecoratorFactory(UserAuth());

  it('returns the authenticated user', () => {
    const user = { userId: 'user-id', email: 'user@example.com' };
    const context = createMockExecutionContext({ user });

    expect(factory(undefined, context)).toEqual(user);
  });

  it('returns a specific user property when requested', () => {
    const user = { userId: 'user-id', email: 'user@example.com' };
    const context = createMockExecutionContext({ user });
    const propertyFactory = getParamDecoratorFactory(UserAuth('email'));

    expect(propertyFactory('email', context)).toBe('user@example.com');
  });

  it('returns undefined when user is missing', () => {
    const context = createMockExecutionContext({});

    expect(factory('email', context)).toBeUndefined();
  });
});
