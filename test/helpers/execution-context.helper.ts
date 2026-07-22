import { ExecutionContext } from '@nestjs/common';

/**
 * Creates a mock ExecutionContext for testing.
 *
 * Note: This helper is used generically across both unit tests (.spec.ts)
 * and end-to-end tests (.e2e-spec.ts). Because it is used generically,
 * it is kept in `test/helpers` and should not be placed inside `test/e2e`.
 */
export function createMockExecutionContext(
  request: Record<string, unknown> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}
