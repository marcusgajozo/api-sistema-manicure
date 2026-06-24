import { ConfigFactory, registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export const databaseConfigFactory: ConfigFactory<DatabaseConfig> = () => ({
  type: (process.env.DATABASE ?? 'postgres') as 'postgres',
  host: process.env.DATABASE_HOST ?? 'postgres-manicure-db',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'manicure_db',
});

export const databaseConfig = registerAs('database', databaseConfigFactory);
