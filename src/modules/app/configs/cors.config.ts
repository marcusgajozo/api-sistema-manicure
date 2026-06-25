import { ConfigFactory, registerAs } from '@nestjs/config';

export interface CorsConfig {
  originWhitelist: string[];
}

type CorsOriginCallback = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

export interface AppCorsOptions {
  origin: CorsOriginCallback;
  credentials: boolean;
}

const DEFAULT_ORIGIN_WHITELIST = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

export function parseCorsOriginWhitelist(value?: string): string[] {
  if (!value?.trim()) {
    return DEFAULT_ORIGIN_WHITELIST;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsConfig(): CorsConfig {
  return {
    originWhitelist: parseCorsOriginWhitelist(
      process.env.CORS_ORIGIN_WHITELIST,
    ),
  };
}

export const corsConfigFactory: ConfigFactory<CorsConfig> = getCorsConfig;

export const corsConfig = registerAs('cors', corsConfigFactory);

export function buildCorsOptions(config: CorsConfig): AppCorsOptions {
  return {
    origin: (origin, callback) => {
      if (!origin || config.originWhitelist.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  };
}
