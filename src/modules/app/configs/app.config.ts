import { ConfigFactory, registerAs } from '@nestjs/config';

interface AppConfig {
  port: number;
}

export const appConfigFactory: ConfigFactory<AppConfig> = () => ({
  port: Number(process.env.API_PORT ?? 3000),
});

export const appConfig = registerAs('app', appConfigFactory);
