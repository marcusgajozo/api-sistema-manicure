import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

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

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { limit, page, startDate, endDate } = paginationQueryDto;

    const whereClause: FindOptionsWhere<NotificationEntity> = {
      appointment: { user: { id: currentUserId } },
    };

    if (startDate && endDate) {
      whereClause.scheduledFor = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.scheduledFor = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereClause.scheduledFor = LessThanOrEqual(endDate);
    }

    const [notifications, totalCount] =
      await this.notificationRepository.findAndCount({
        where: whereClause,
        relations: ['appointment'],
        skip: (page - 1) * limit,
        take: limit,
        order: { scheduledFor: 'ASC' },
      });

    return { notifications, totalCount };
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
