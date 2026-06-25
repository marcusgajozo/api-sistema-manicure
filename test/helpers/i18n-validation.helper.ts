import { ValidationError } from 'class-validator';

import { I18nPath } from '@/generated/i18n.generated';

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
