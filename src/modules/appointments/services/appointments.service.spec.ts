import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository, UpdateResult } from 'typeorm';

import { TimeOffEntity } from '../../time-offs/entities/time-off.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import { NotifyReturnClientEnum } from '../enums/notify-client.enum';
import { StatusAppointmentEnum } from '../enums/status-appointment.enum';
import { AppointmentsService } from './appointments.service';

function createMockQueryBuilder(getCountResult: number) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(getCountResult),
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepository: jest.Mocked<
    Pick<
      Repository<AppointmentEntity>,
      | 'create'
      | 'save'
      | 'findAndCount'
      | 'findOne'
      | 'update'
      | 'remove'
      | 'count'
    >
  >;
  let timeOffRepository: jest.Mocked<
    Pick<Repository<TimeOffEntity>, 'createQueryBuilder'>
  >;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;
  let timeOffQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const userId = 'user-id';

  const createAppointmentDto: CreateAppointmentDto = {
    procedureName: 'Manicure',
    procedurePrice: 5000,
    clientName: 'Maria Silva',
    phoneClient: '11999998888',
    startDate: '2026-07-01T09:00:00.000Z',
    endDate: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    timeOffQueryBuilder = createMockQueryBuilder(0);

    appointmentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };

    timeOffRepository = {
      createQueryBuilder: jest.fn(() => timeOffQueryBuilder) as never,
    };

    i18n = {
      translate: jest.fn((key: string) => key),
    } as unknown as jest.Mocked<Pick<I18nService, 'translate'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(AppointmentEntity),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(TimeOffEntity),
          useValue: timeOffRepository,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('create', () => {
    it('creates and persists an appointment for the authenticated user', async () => {
      const createdAppointment = {
        ...createAppointmentDto,
        user: { id: userId },
      } as unknown as AppointmentEntity;
      const savedAppointment = {
        ...createdAppointment,
        id: 'appointment-id',
      } as AppointmentEntity;

      appointmentRepository.create.mockReturnValue(createdAppointment);
      appointmentRepository.save.mockResolvedValue(savedAppointment);

      await expect(
        service.create(createAppointmentDto, userId),
      ).resolves.toEqual(savedAppointment);

      expect(appointmentRepository.create).toHaveBeenCalledWith({
        endDate: createAppointmentDto.endDate,
        startDate: createAppointmentDto.startDate,
        clientName: createAppointmentDto.clientName,
        phoneClient: createAppointmentDto.phoneClient,
        procedureFollowUpDays: undefined,
        procedureName: createAppointmentDto.procedureName,
        procedurePrice: createAppointmentDto.procedurePrice,
        user: { id: userId },
      });
      expect(appointmentRepository.save).toHaveBeenCalledWith(
        createdAppointment,
      );
    });

    it('throws ConflictException when another appointment overlaps', async () => {
      appointmentRepository.count.mockResolvedValue(1);

      await expect(
        service.create(createAppointmentDto, userId),
      ).rejects.toThrow(ConflictException);
      expect(i18n.translate).toHaveBeenCalledWith(
        'validation.APPOINTMENT_CONFLICT',
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a time off overlaps', async () => {
      timeOffQueryBuilder.getCount.mockResolvedValue(1);

      await expect(
        service.create(createAppointmentDto, userId),
      ).rejects.toThrow(ConflictException);
      expect(i18n.translate).toHaveBeenCalledWith(
        'validation.APPOINTMENT_CONFLICT',
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated appointments for the authenticated user', async () => {
      const appointments = [{ id: 'appointment-id' }] as AppointmentEntity[];

      appointmentRepository.findAndCount.mockResolvedValue([appointments, 1]);

      await expect(
        service.findAll({ page: 2, limit: 5 }, userId),
      ).resolves.toEqual({
        appointments,
        totalCount: 1,
      });

      expect(appointmentRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        skip: 1,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('returns an appointment when it belongs to the user', async () => {
      const appointment = { id: 'appointment-id' } as AppointmentEntity;

      appointmentRepository.findOne.mockResolvedValue(appointment);

      await expect(service.findOne('appointment-id', userId)).resolves.toEqual(
        appointment,
      );

      expect(appointmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'appointment-id', user: { id: userId } },
      });
    });

    it('throws NotFoundException when the appointment does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });

  describe('update', () => {
    const updateAppointmentDto: UpdateAppointmentDto = {
      clientName: 'Ana Souza',
      statusAppointment: StatusAppointmentEnum.DONE,
      notifyReturnClient: NotifyReturnClientEnum.NOTIFIED,
    };

    it('throws NotFoundException when the appointment does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', updateAppointmentDto, userId),
      ).rejects.toThrow(NotFoundException);
      expect(appointmentRepository.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the updated schedule overlaps', async () => {
      const appointment = {
        id: 'appointment-id',
        startDate: new Date('2026-07-01T09:00:00.000Z'),
        endDate: new Date('2026-07-01T10:00:00.000Z'),
      } as AppointmentEntity;

      appointmentRepository.findOne.mockResolvedValue(appointment);
      appointmentRepository.count.mockResolvedValue(1);

      await expect(
        service.update('appointment-id', updateAppointmentDto, userId),
      ).rejects.toThrow(ConflictException);
      expect(appointmentRepository.update).not.toHaveBeenCalled();
    });

    it('updates the appointment when it belongs to the user', async () => {
      const appointment = {
        id: 'appointment-id',
        startDate: new Date('2026-07-01T09:00:00.000Z'),
        endDate: new Date('2026-07-01T10:00:00.000Z'),
      } as AppointmentEntity;
      const updateResult = { affected: 1 } as UpdateResult;

      appointmentRepository.findOne.mockResolvedValue(appointment);
      appointmentRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.update('appointment-id', updateAppointmentDto, userId),
      ).resolves.toEqual(updateResult);

      expect(appointmentRepository.update).toHaveBeenCalledWith(
        'appointment-id',
        {
          endDate: undefined,
          startDate: undefined,
          clientName: 'Ana Souza',
          phoneClient: undefined,
          procedureFollowUpDays: undefined,
          procedureName: undefined,
          procedurePrice: undefined,
          updatedAt: expect.any(Date) as Date,
          notifyReturnClient: NotifyReturnClientEnum.NOTIFIED,
          statusAppointment: StatusAppointmentEnum.DONE,
        },
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the appointment does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(appointmentRepository.remove).not.toHaveBeenCalled();
    });

    it('removes the appointment when it belongs to the user', async () => {
      const appointment = { id: 'appointment-id' } as AppointmentEntity;

      appointmentRepository.findOne.mockResolvedValue(appointment);
      appointmentRepository.remove.mockResolvedValue(appointment);

      await expect(service.remove('appointment-id', userId)).resolves.toEqual(
        appointment,
      );
      expect(appointmentRepository.remove).toHaveBeenCalledWith(appointment);
    });
  });
});
