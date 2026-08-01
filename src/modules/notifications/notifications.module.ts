import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { NotificationTemplatesModule } from '../notification-templates/notification-templates.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, AppointmentEntity]),
    NotificationTemplatesModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
