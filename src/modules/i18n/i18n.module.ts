import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

import { i18nConfig } from './configs/i18n.config';

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [ConfigModule.forFeature(i18nConfig)],
      inject: [i18nConfig.KEY],
      useFactory: (config: ConfigType<typeof i18nConfig>) => ({
        fallbackLanguage: config.fallbackLanguage,
        loaderOptions: {
          path: join(__dirname, 'languages').replace('/test/', '/'),
          watch: false,
        },
        typesOutputPath:
          process.env.NODE_ENV === 'production'
            ? undefined
            : join(
                __dirname,
                '..',
                '..',
                '..',
                '..',
                'src',
                'generated',
                'i18n.generated.ts',
              ),
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
