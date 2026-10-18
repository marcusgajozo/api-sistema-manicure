import { config } from 'dotenv';
import { resolve } from 'path';

export function loadE2eEnv(): void {
  config({ path: resolve(__dirname, '../../../.env') });
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
  process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'manicure_db_e2e';
}
