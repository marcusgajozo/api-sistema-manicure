import { ValidationError } from 'class-validator';

import { I18nPath } from '@/generated/i18n.generated';

/**
 * Helper to validate i18n translation keys in class-validator errors.
 *
 * Note: This helper is used generically across both unit tests (.spec.ts)
 * and end-to-end tests (.e2e-spec.ts). Because it is used generically,
 * it is kept in `test/helpers` and should not be placed inside `test/e2e`.
 */
export function findValidationError(
  errors: ValidationError[],
  property: string,
): ValidationError | undefined {
  return errors.find((error) => error.property === property);
}

export function expectValidationI18nKey(
  errors: ValidationError[],
  property: string,
  key: I18nPath,
): void {
  const error = findValidationError(errors, property);

  expect(error).toBeDefined();

  const messages = Object.values(error?.constraints ?? {});

  expect(messages.some((message) => message.startsWith(`${key}|`))).toBe(true);
}
