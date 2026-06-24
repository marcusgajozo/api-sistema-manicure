import { join } from 'path';
import { DataSource } from 'typeorm';
import { getMigrationConnectionOptions } from './database.config';
import { loadAppEnv } from './load-env';

loadAppEnv();

export default new DataSource({
  ...getMigrationConnectionOptions(),
  entities: [join(__dirname, '..', 'src', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
