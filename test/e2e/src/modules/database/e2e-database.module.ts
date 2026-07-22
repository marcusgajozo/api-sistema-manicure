import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { e2eDatabaseConfig } from '@test/e2e/modules/database/configs/e2e-database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(e2eDatabaseConfig)],
      inject: [e2eDatabaseConfig.KEY],
      useFactory: (config: ConfigType<typeof e2eDatabaseConfig>) => ({
        type: config.type,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        schema: config.schema,
        autoLoadEntities: true,
        synchronize: true,
        retryAttempts: 0,
      }),
    }),
  ],
})
export class E2eDatabaseModule {}
