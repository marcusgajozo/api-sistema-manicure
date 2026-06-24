export interface DatabaseConnectionOptions {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function getMigrationConnectionOptions(): DatabaseConnectionOptions {
  return {
    type: (process.env.DATABASE ?? 'postgres') as 'postgres',
    host: process.env.DATABASE_HOST_EXTERNAL ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT_EXTERNAL ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'manicure_db',
  };
}
