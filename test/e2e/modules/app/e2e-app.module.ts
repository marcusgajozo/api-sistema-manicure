import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from '@src/common/filters/global-exception.filter';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { JwtAuthGuard } from '@src/modules/authentication/guards/jwt-auth.guard';
import { ScheduleTemplatesModule } from '@src/modules/schedule-templates/schedule-templates.module';
import { TimeOffsModule } from '@src/modules/time-offs/time-offs.module';
import { UsersModule } from '@src/modules/users/users.module';
import { E2eDatabaseModule } from '@test/e2e/modules/database/e2e-database.module';
import { E2eI18nModule } from '@test/e2e/modules/i18n/e2e-i18n.module';

@Module({
  imports: [
    E2eDatabaseModule,
    E2eI18nModule,
    AuthenticationModule,
    UsersModule,
    TimeOffsModule,
    ScheduleTemplatesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class E2eAppModule {}
