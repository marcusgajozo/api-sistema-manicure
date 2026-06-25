import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { I18nValidationPipe } from 'nestjs-i18n';

import { loadAppEnv } from '../database/load-env';
import { AppModule } from './modules/app/app.module';
import {
  buildCorsOptions,
  corsConfig,
} from './modules/app/configs/cors.config';

async function bootstrap() {
  loadAppEnv();

  const app = await NestFactory.create(AppModule);
  const corsConfiguration = app.get<ConfigType<typeof corsConfig>>(
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

  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The NestJS API description')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: '/swagger-json',
  });

  await app.listen(process.env.PORT || 3000);
}

void bootstrap();
