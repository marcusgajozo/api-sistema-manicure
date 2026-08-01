import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from '@src/common/filters/global-exception.filter';
import { corsConfig } from '@src/modules/app/configs/cors.config';
import { AppointmentsModule } from '@src/modules/appointments/appointments.module';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { JwtAuthGuard } from '@src/modules/authentication/guards/jwt-auth.guard';
import { ClientsModule } from '@src/modules/clients/clients.module';
import { ProceduresModule } from '@src/modules/procedures/procedures.module';
import { ScheduleTemplatesModule } from '@src/modules/schedule-templates/schedule-templates.module';
import { TimeOffsModule } from '@src/modules/time-offs/time-offs.module';
import { UsersModule } from '@src/modules/users/users.module';
import { E2eDatabaseModule } from '@test/e2e/modules/database/e2e-database.module';
import { E2eI18nModule } from '@test/e2e/modules/i18n/e2e-i18n.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ConfigModule.forFeature(corsConfig),
    E2eDatabaseModule,
    E2eI18nModule,
    AuthenticationModule,
    UsersModule,
    ClientsModule,
    TimeOffsModule,
    ScheduleTemplatesModule,
    ProceduresModule,
    AppointmentsModule,
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
