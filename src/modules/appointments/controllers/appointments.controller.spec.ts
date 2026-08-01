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
      startDate: new Date('2026-07-01T09:00:00'),
      endDate: new Date('2026-07-01T10:00:00'),
    };

    it('creates an appointment for the authenticated user', async () => {
      appointmentsService.create.mockResolvedValue({
        id: 'appointment-id',
      } as AppointmentEntity);

      await expect(
        controller.create(createAppointmentDto),
      ).resolves.toBeUndefined();
      expect(appointmentsService.create).toHaveBeenCalledWith(
        createAppointmentDto,
      );
    });

    it('propagates ConflictException from the controller', async () => {
      appointmentsService.create.mockResolvedValue(null as never);

      await expect(controller.create(createAppointmentDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated appointments', async () => {
      const appointments = [{ id: 'appointment-id' }] as AppointmentEntity[];

      appointmentsService.findAll.mockResolvedValue({
        appointments,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(
        new PaginatedResponseDto(appointments, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(appointmentsService.findAll).toHaveBeenCalledWith({
        limit: 10,
        page: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns an appointment when it exists', async () => {
      const appointment = { id: 'appointment-id' } as AppointmentEntity;

      appointmentsService.findOne.mockResolvedValue(appointment);

      const result = await controller.findOne('appointment-id');

      expect(result).toEqual(new ResponseDto(appointment));
    });

    it('propagates NotFoundException from the controller', async () => {
      appointmentsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateAppointmentDto: UpdateAppointmentDto = {
      statusAppointment: StatusAppointmentEnum.CANCELED,
    };

    it('updates an appointment when it exists', async () => {
      appointmentsService.findOne.mockResolvedValue({
        id: 'appointment-id',
      } as AppointmentEntity);
      appointmentsService.update.mockResolvedValue({ affected: 1 } as never);

      await expect(
        controller.update('appointment-id', updateAppointmentDto),
      ).resolves.toBeUndefined();
      expect(appointmentsService.update).toHaveBeenCalledWith(
        'appointment-id',
        updateAppointmentDto,
      );
    });

    it('propagates NotFoundException from the controller', async () => {
      appointmentsService.findOne.mockResolvedValue(null);

      await expect(
        controller.update('missing-id', updateAppointmentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an appointment when it exists', async () => {
      appointmentsService.remove.mockResolvedValue({
        id: 'appointment-id',
      } as AppointmentEntity);

      await expect(
        controller.remove('appointment-id'),
      ).resolves.toBeUndefined();
      expect(appointmentsService.remove).toHaveBeenCalledWith('appointment-id');
    });

    it('propagates NotFoundException from the controller', async () => {
      appointmentsService.remove.mockResolvedValue(null as never);

      await expect(controller.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
