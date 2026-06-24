import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { ClientsModule } from '../clients/clients.module';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';
import { ProceduresModule } from '../procedures/procedures.module';
import { ScheduleTemplatesModule } from '../schedule-templates/schedule-templates.module';
import { TimeOffsModule } from '../time-offs/time-offs.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    I18nModule,
    AuthenticationModule,
    UsersModule,
    ProceduresModule,
    ClientsModule,
    ScheduleTemplatesModule,
    TimeOffsModule,
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
export class AppModule {}
