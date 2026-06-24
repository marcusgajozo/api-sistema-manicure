import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  databaseConfig,
  databaseConfigFactory,
  DatabaseConfig,
} from './configs/database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfigFactory),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.getOrThrow<DatabaseConfig>(databaseConfig.KEY),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
