import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = resolve(__dirname, '../../..');
const defaultEnvPath = resolve(projectRoot, '.env');

if (existsSync(defaultEnvPath)) {
  config({ path: defaultEnvPath });
}

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_E2E_SCHEMA ??= 'e2e_test';
