import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { i18nConfig } from '@src/modules/i18n/configs/i18n.config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [ConfigModule.forFeature(i18nConfig)],
      inject: [i18nConfig.KEY],
      useFactory: (config: ConfigType<typeof i18nConfig>) => ({
        fallbackLanguage: config.fallbackLanguage,
        loaderOptions: {
          path: join(process.cwd(), 'src', 'modules', 'i18n', 'languages'),
          watch: false,
        },
        typesOutputPath: join(
          process.cwd(),
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
export class E2eI18nModule {}
