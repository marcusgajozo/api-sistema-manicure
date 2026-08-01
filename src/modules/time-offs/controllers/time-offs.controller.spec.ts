import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';

import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import { TimeOffsService } from '../services/time-offs.service';
import { TimeOffsController } from './time-offs.controller';

describe('TimeOffsController', () => {
  let controller: TimeOffsController;
  let timeOffsService: jest.Mocked<
    Pick<
      TimeOffsService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;

  beforeEach(async () => {
    timeOffsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    i18n = {
      translate: jest.fn((key: string) => key),
    } as unknown as jest.Mocked<Pick<I18nService, 'translate'>>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeOffsController],
      providers: [
        {
          provide: TimeOffsService,
          useValue: timeOffsService,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    controller = module.get<TimeOffsController>(TimeOffsController);
  });

  describe('create', () => {
    const createTimeOffDto: CreateTimeOffDto = {
      startDate: new Date('2026-07-01T09:00:00'),
      endDate: new Date('2026-07-05T18:00:00'),
      reason: 'Férias',
    };

    it('creates a time off for the authenticated user', async () => {
      timeOffsService.create.mockResolvedValue({
        id: 'time-off-id',
      } as TimeOffEntity);

      await expect(
        controller.create(createTimeOffDto),
      ).resolves.toBeUndefined();
      expect(timeOffsService.create).toHaveBeenCalledWith(createTimeOffDto);
    });
  });

  describe('findAll', () => {
    it('returns paginated time offs', async () => {
      const timeOffs = [{ id: 'time-off-id' }] as TimeOffEntity[];

      timeOffsService.findAll.mockResolvedValue({
        timeOffs,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(
        new PaginatedResponseDto(timeOffs, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(timeOffsService.findAll).toHaveBeenCalledWith({
        limit: 10,
        page: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns a time off when it exists', async () => {
      const timeOff = { id: 'time-off-id' } as TimeOffEntity;

      timeOffsService.findOne.mockResolvedValue(timeOff);

      const result = await controller.findOne('time-off-id');

      expect(result).toEqual(new ResponseDto(timeOff));
    });

    it('throws NotFoundException when the time off does not exist', async () => {
      timeOffsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });

  describe('update', () => {
    const updateTimeOffDto: UpdateTimeOffDto = {
      reason: 'Viagem',
    };

    it('updates a time off when it exists', async () => {
      timeOffsService.update.mockResolvedValue({ affected: 1 } as never);

      await expect(
        controller.update('time-off-id', updateTimeOffDto),
      ).resolves.toBeUndefined();
      expect(timeOffsService.update).toHaveBeenCalledWith(
        'time-off-id',
        updateTimeOffDto,
      );
    });

    it('throws NotFoundException when the time off does not exist', async () => {
      timeOffsService.update.mockResolvedValue(null);

      await expect(
        controller.update('missing-id', updateTimeOffDto),
      ).rejects.toThrow(NotFoundException);
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });

  describe('remove', () => {
    it('removes a time off when it exists', async () => {
      timeOffsService.remove.mockResolvedValue({
        id: 'time-off-id',
      } as TimeOffEntity);

      await expect(controller.remove('time-off-id')).resolves.toBeUndefined();
      expect(timeOffsService.remove).toHaveBeenCalledWith('time-off-id');
    });

    it('throws NotFoundException when the time off does not exist', async () => {
      timeOffsService.remove.mockResolvedValue(null);

      await expect(controller.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });
});
