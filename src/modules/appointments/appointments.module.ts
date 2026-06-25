import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeOffEntity } from '../time-offs/entities/time-off.entity';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentsService } from './services/appointments.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentEntity, TimeOffEntity])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
