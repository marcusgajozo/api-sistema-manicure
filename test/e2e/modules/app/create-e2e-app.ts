import { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  buildCorsOptions,
  corsConfig,
} from '@src/modules/app/configs/cors.config';
import { E2eAppModule } from '@test/e2e/modules/app/e2e-app.module';
import { ensureE2eSchema } from '@test/e2e/modules/database/helpers/e2e-database.helper';
import cookieParser from 'cookie-parser';
import { I18nValidationPipe } from 'nestjs-i18n';
import { DataSource } from 'typeorm';

export interface E2eAppContext {
  app: INestApplication;
  dataSource: DataSource;
  moduleFixture: TestingModule;
}

export async function createE2eApp(): Promise<E2eAppContext> {
  await ensureE2eSchema();

  const moduleFixture = await Test.createTestingModule({
    imports: [E2eAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const dataSource = moduleFixture.get(DataSource);

  const corsConfiguration = moduleFixture.get<ConfigType<typeof corsConfig>>(
    corsConfig.KEY,
  );

  app.enableCors(buildCorsOptions(corsConfiguration));
  app.use(cookieParser());
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return { app, dataSource, moduleFixture };
}
