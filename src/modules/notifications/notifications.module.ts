import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { NotificationTemplatesModule } from '../notification-templates/notification-templates.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';
import { SendNotificationService } from './services/send-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, AppointmentEntity]),
    NotificationTemplatesModule,
    RabbitmqModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, SendNotificationService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
