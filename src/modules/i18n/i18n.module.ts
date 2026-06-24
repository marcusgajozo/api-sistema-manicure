import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

import {
  I18nConfig,
  i18nConfig,
  i18nConfigFactory,
} from './configs/i18n.config';

@Module({
  imports: [
    ConfigModule.forFeature(i18nConfigFactory),
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow<I18nConfig>(i18nConfig.KEY)
          .fallbackLanguage,
        loaderOptions: {
          path: join(__dirname, 'languages'),
          watch: true,
        },
        typesOutputPath: join(__dirname, '..', '..', 'i18n.generated.ts'),
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
})
export class I18nModule {}
