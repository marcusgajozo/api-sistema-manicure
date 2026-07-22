import { ConfigFactory, registerAs } from '@nestjs/config';

export interface E2eDatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
}

export const e2eDatabaseConfigFactory: ConfigFactory<
  E2eDatabaseConfig
> = () => ({
  type: (process.env.DATABASE ?? 'postgres') as 'postgres',
  host: process.env.DATABASE_HOST_EXTERNAL ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT_EXTERNAL ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'manicure_db',
  schema: process.env.DATABASE_E2E_SCHEMA ?? 'e2e_test',
});

export const e2eDatabaseConfig = registerAs(
  'database',
  e2eDatabaseConfigFactory,
);

export function getE2eDatabaseConfig(): E2eDatabaseConfig {
  return e2eDatabaseConfigFactory() as E2eDatabaseConfig;
}
