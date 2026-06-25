import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';

import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import { StatusAppointmentEnum } from '../enums/status-appointment.enum';
import { AppointmentsService } from '../services/appointments.service';
import { AppointmentsController } from './appointments.controller';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let appointmentsService: jest.Mocked<
    Pick<
      AppointmentsService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;

  const userId = 'user-id';

  beforeEach(async () => {
    appointmentsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: appointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  describe('create', () => {
    const createAppointmentDto: CreateAppointmentDto = {
      procedureName: 'Manicure',
      procedurePrice: 5000,
      clientName: 'Maria Silva',
      phoneClient: '11999998888',
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-01T10:00:00.000Z',
    };

    it('creates an appointment for the authenticated user', async () => {
      appointmentsService.create.mockResolvedValue({
        id: 'appointment-id',
      } as AppointmentEntity);

      await expect(
        controller.create(createAppointmentDto, userId),
      ).resolves.toBeUndefined();
      expect(appointmentsService.create).toHaveBeenCalledWith(
        createAppointmentDto,
        userId,
      );
    });

    it('propagates ConflictException from the service', async () => {
      appointmentsService.create.mockRejectedValue(
        new ConflictException('validation.APPOINTMENT_CONFLICT'),
      );

      await expect(
        controller.create(createAppointmentDto, userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated appointments', async () => {
      const appointments = [{ id: 'appointment-id' }] as AppointmentEntity[];

      appointmentsService.findAll.mockResolvedValue({
        appointments,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 }, userId);

      expect(result).toEqual(
        new PaginatedResponseDto(appointments, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(appointmentsService.findAll).toHaveBeenCalledWith(
        { limit: 10, page: 1 },
        userId,
      );
    });
  });

  describe('findOne', () => {
    it('returns an appointment when it exists', async () => {
      const appointment = { id: 'appointment-id' } as AppointmentEntity;

      appointmentsService.findOne.mockResolvedValue(appointment);

      const result = await controller.findOne('appointment-id', userId);

      expect(result).toEqual(new ResponseDto(appointment));
    });

    it('propagates NotFoundException from the service', async () => {
      appointmentsService.findOne.mockRejectedValue(
        new NotFoundException('validation.NOT_FOUND'),
      );

      await expect(controller.findOne('missing-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateAppointmentDto: UpdateAppointmentDto = {
      statusAppointment: StatusAppointmentEnum.CANCELED,
    };

    it('updates an appointment when it exists', async () => {
      appointmentsService.update.mockResolvedValue({ affected: 1 } as never);

      await expect(
        controller.update('appointment-id', updateAppointmentDto, userId),
      ).resolves.toBeUndefined();
      expect(appointmentsService.update).toHaveBeenCalledWith(
        'appointment-id',
        updateAppointmentDto,
        userId,
      );
    });

    it('propagates NotFoundException from the service', async () => {
      appointmentsService.update.mockRejectedValue(
        new NotFoundException('validation.NOT_FOUND'),
      );

      await expect(
        controller.update('missing-id', updateAppointmentDto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an appointment when it exists', async () => {
      appointmentsService.remove.mockResolvedValue({
        id: 'appointment-id',
      } as AppointmentEntity);

      await expect(
        controller.remove('appointment-id', userId),
      ).resolves.toBeUndefined();
      expect(appointmentsService.remove).toHaveBeenCalledWith(
        'appointment-id',
        userId,
      );
    });

    it('propagates NotFoundException from the service', async () => {
      appointmentsService.remove.mockRejectedValue(
        new NotFoundException('validation.NOT_FOUND'),
      );

      await expect(controller.remove('missing-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
