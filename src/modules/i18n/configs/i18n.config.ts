import { ConfigFactory, registerAs } from '@nestjs/config';

export interface I18nConfig {
  fallbackLanguage: string;
}

export const i18nConfigFactory: ConfigFactory<I18nConfig> = () => ({
  fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? 'pt-BR',
});

export const i18nConfig = registerAs('i18n', i18nConfigFactory);
