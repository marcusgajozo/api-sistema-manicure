import { config } from 'dotenv';
import { resolve } from 'path';

const projectRoot = resolve(__dirname, '..');

export function loadAppEnv(): void {
  config({ path: resolve(projectRoot, '.env') });
}
