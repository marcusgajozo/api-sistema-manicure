import { i18nValidationMessage as i18nValidationMessageHelperFn } from 'nestjs-i18n';

import { I18nPath, I18nTranslations } from '@/generated/i18n.generated';

export function i18nValidationMessageHelper(translationKey: I18nPath) {
  return i18nValidationMessageHelperFn<I18nTranslations>(translationKey);
}
