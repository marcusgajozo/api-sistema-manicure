import { getE2eDatabaseConfig } from '@test/e2e/modules/database/configs/e2e-database.config';
import { DataSource } from 'typeorm';

export function getE2eSchema(): string {
  return process.env.DATABASE_E2E_SCHEMA ?? 'e2e_test';
}

export async function ensureE2eSchema(): Promise<void> {
  const config = getE2eDatabaseConfig();
  const bootstrapDataSource = new DataSource({
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
  });

  await bootstrapDataSource.initialize();

  try {
    await bootstrapDataSource.query(
      `CREATE SCHEMA IF NOT EXISTS "${config.schema}"`,
    );
  } finally {
    await bootstrapDataSource.destroy();
  }
}

export async function resetE2eDatabase(dataSource: DataSource): Promise<void> {
  const schema = getE2eSchema();
  const tables = dataSource.entityMetadatas.map(
    (meta) => `"${schema}"."${meta.tableName}"`,
  );

  if (tables.length === 0) {
    return;
  }

  await dataSource.query(
    `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

export async function dropE2eSchema(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    return;
  }

  const schema = getE2eSchema();
  await dataSource.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
