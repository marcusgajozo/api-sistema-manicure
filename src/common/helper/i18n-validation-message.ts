import { i18nValidationMessage as i18nValidationMessageFn } from 'nestjs-i18n';
import { I18nPath, I18nTranslations } from '@/generated/i18n.generated';

export function i18nValidationMessage(translationKey: I18nPath) {
  return i18nValidationMessageFn<I18nTranslations>(translationKey);
}
