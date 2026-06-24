import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import {
  AuthenticationConfig,
  authenticationConfig,
  authenticationConfigFactory,
} from './configs/authentication.config';
import { AuthenticationController } from './controllers/authentication.controller';
import { AuthenticationEntity } from './entities/authentication.entity';
import { AuthenticationService } from './services/authentication.service';
import { BcryptService } from './services/bycript.service';
import { HashingService } from './services/hashing.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authenticationConfigFactory),
    TypeOrmModule.forFeature([AuthenticationEntity, UserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.getOrThrow<AuthenticationConfig>(
          authenticationConfig.KEY,
        );

        return {
          secret: authConfig.secret,
          signOptions: { expiresIn: authConfig.expiresIn },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthenticationController],
  providers: [
    { provide: HashingService, useClass: BcryptService },
    AuthenticationService,
    JwtStrategy,
  ],
})
export class AuthenticationModule {}
