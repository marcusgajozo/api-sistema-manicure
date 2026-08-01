import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AppointmentCanceledEvent,
  AppointmentCreatedEvent,
  AppointmentRescheduledEvent,
} from '../../appointments/events/appointment-events';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<
    Pick<Repository<NotificationEntity>, 'create' | 'save' | 'softDelete'>
  >;

  const appointmentId = 'appointment-123';
  const appointmentDate = new Date('2026-08-05T10:00:00.000Z');

  beforeEach(async () => {
    notificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: notificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAppointmentCreated', () => {
    it('should create and save reminder and follow_up notifications', async () => {
      const event = new AppointmentCreatedEvent(appointmentId, appointmentDate);

      const reminderDate = new Date('2026-08-04T10:00:00.000Z'); // 1 day before
      const followUpDate = new Date('2026-08-10T10:00:00.000Z'); // 5 days after

      const mockNotifications = [
        {
          appointment: { id: appointmentId },
          type: NotificationTypeEnum.REMINDER,
          scheduledFor: reminderDate,
        },
        {
          appointment: { id: appointmentId },
          type: NotificationTypeEnum.FOLLOW_UP,
          scheduledFor: followUpDate,
        },
      ] as unknown as NotificationEntity[];

      notificationRepository.create.mockReturnValue(mockNotifications);
      notificationRepository.save.mockResolvedValue(mockNotifications);

      await service.handleAppointmentCreated(event);

      expect(notificationRepository.create).toHaveBeenCalledWith([
        {
          appointment: { id: appointmentId },
          type: NotificationTypeEnum.REMINDER,
          scheduledFor: reminderDate,
        },
        {
          appointment: { id: appointmentId },
          type: NotificationTypeEnum.FOLLOW_UP,
          scheduledFor: followUpDate,
        },
      ]);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        mockNotifications,
      );
    });
  });

  describe('handleAppointmentCanceled', () => {
    it('should soft delete pending notifications for the appointment', async () => {
      const event = new AppointmentCanceledEvent(appointmentId);

      await service.handleAppointmentCanceled(event);

      expect(notificationRepository.softDelete).toHaveBeenCalledWith({
        appointment: { id: appointmentId },
      });
    });
  });

  describe('handleAppointmentRescheduled', () => {
    it('should cancel existing notifications and create new ones', async () => {
      const newAppointmentDate = new Date('2026-08-06T10:00:00.000Z');
      const event = new AppointmentRescheduledEvent(
        appointmentId,
        newAppointmentDate,
      );

      // Spy on the service's own methods
      const cancelSpy = jest.spyOn(service, 'handleAppointmentCanceled');
      const createSpy = jest.spyOn(service, 'handleAppointmentCreated');

      await service.handleAppointmentRescheduled(event);

      expect(cancelSpy).toHaveBeenCalledWith(
        new AppointmentCanceledEvent(appointmentId),
      );
      expect(createSpy).toHaveBeenCalledWith(
        new AppointmentCreatedEvent(appointmentId, newAppointmentDate),
      );
    });
  });
});
