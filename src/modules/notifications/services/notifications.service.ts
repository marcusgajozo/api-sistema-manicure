import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AppointmentCanceledEvent,
  AppointmentCreatedEvent,
  AppointmentEventEnum,
  AppointmentRescheduledEvent,
} from '../../appointments/events/appointment-events';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  onModuleInit() {
    this.logger.log('NotificationsService initialized!');
  }

  @OnEvent(AppointmentEventEnum.CREATED)
  async handleAppointmentCreated(event: AppointmentCreatedEvent) {
    this.logger.log(`Handling appointment.created for ${event.appointmentId}`);

    const reminderDate = new Date(event.appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    const followUpDate = new Date(event.appointmentDate);
    followUpDate.setDate(followUpDate.getDate() + 5);

    const notifications = this.notificationRepository.create([
      {
        appointment: { id: event.appointmentId },
        type: NotificationTypeEnum.REMINDER,
        scheduledFor: reminderDate,
      },
      {
        appointment: { id: event.appointmentId },
        type: NotificationTypeEnum.FOLLOW_UP,
        scheduledFor: followUpDate,
      },
    ]);

    await this.notificationRepository.save(notifications);
  }

  @OnEvent(AppointmentEventEnum.CANCELED)
  async handleAppointmentCanceled(event: AppointmentCanceledEvent) {
    this.logger.log(`Handling appointment.canceled for ${event.appointmentId}`);

    await this.notificationRepository.softDelete({
      appointment: { id: event.appointmentId },
    });
  }

  @OnEvent(AppointmentEventEnum.RESCHEDULED)
  async handleAppointmentRescheduled(event: AppointmentRescheduledEvent) {
    this.logger.log(
      `Handling appointment.rescheduled for ${event.appointmentId}`,
    );

    await this.handleAppointmentCanceled(
      new AppointmentCanceledEvent(event.appointmentId),
    );

    await this.handleAppointmentCreated(
      new AppointmentCreatedEvent(
        event.appointmentId,
        event.newAppointmentDate,
      ),
    );
  }
}
