import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';

import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import { TimeOffsService } from './time-offs.service';

describe('TimeOffsService', () => {
  let service: TimeOffsService;
  let timeOffRepository: jest.Mocked<
    Pick<
      Repository<TimeOffEntity>,
      'create' | 'save' | 'findAndCount' | 'findOne' | 'update' | 'remove'
    >
  >;

  const userId = 'user-id';

  beforeEach(async () => {
    timeOffRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffsService,
        {
          provide: getRepositoryToken(TimeOffEntity),
          useValue: timeOffRepository,
        },
      ],
    }).compile();

    service = module.get<TimeOffsService>(TimeOffsService);
  });

  describe('create', () => {
    const createTimeOffDto: CreateTimeOffDto = {
      startDate: new Date('2026-07-01T09:00:00'),
      endDate: new Date('2026-07-05T18:00:00'),
      reason: 'Férias',
    };

    it('creates and persists a time off for the authenticated user', async () => {
      const createdTimeOff = {
        startDate: createTimeOffDto.startDate,
        endDate: createTimeOffDto.endDate,
        reason: createTimeOffDto.reason,
        user: { id: userId },
      } as TimeOffEntity;
      const savedTimeOff = {
        id: 'time-off-id',
        startDate: createTimeOffDto.startDate,
        endDate: createTimeOffDto.endDate,
        reason: createTimeOffDto.reason,
        user: { id: userId },
      } as TimeOffEntity;

      timeOffRepository.create.mockReturnValue(createdTimeOff);
      timeOffRepository.save.mockResolvedValue(savedTimeOff);

      await expect(service.create(createTimeOffDto, userId)).resolves.toEqual(
        savedTimeOff,
      );

      expect(timeOffRepository.create).toHaveBeenCalledWith({
        startDate: createTimeOffDto.startDate,
        endDate: createTimeOffDto.endDate,
        reason: createTimeOffDto.reason,
        user: { id: userId },
      });
      expect(timeOffRepository.save).toHaveBeenCalledWith(createdTimeOff);
    });
  });

  describe('findAll', () => {
    it('returns paginated time offs for the authenticated user', async () => {
      const timeOffs = [{ id: 'time-off-id' }] as TimeOffEntity[];

      timeOffRepository.findAndCount.mockResolvedValue([timeOffs, 1]);

      await expect(
        service.findAll({ page: 2, limit: 5 }, userId),
      ).resolves.toEqual({
        timeOffs,
        totalCount: 1,
      });

      expect(timeOffRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        skip: 1,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('returns a time off when it belongs to the user', async () => {
      const timeOff = { id: 'time-off-id' } as TimeOffEntity;

      timeOffRepository.findOne.mockResolvedValue(timeOff);

      await expect(service.findOne('time-off-id', userId)).resolves.toEqual(
        timeOff,
      );

      expect(timeOffRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'time-off-id', user: { id: userId } },
      });
    });

    it('returns null when the time off does not exist', async () => {
      timeOffRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', userId)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    const updateTimeOffDto: UpdateTimeOffDto = {
      reason: 'Viagem',
    };

    it('returns null when the time off does not exist', async () => {
      timeOffRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', updateTimeOffDto, userId),
      ).resolves.toBeNull();
      expect(timeOffRepository.update).not.toHaveBeenCalled();
    });

    it('updates the time off when it belongs to the user', async () => {
      const timeOff = { id: 'time-off-id' } as TimeOffEntity;
      const updateResult = { affected: 1 } as UpdateResult;

      timeOffRepository.findOne.mockResolvedValue(timeOff);
      timeOffRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.update('time-off-id', updateTimeOffDto, userId),
      ).resolves.toEqual(updateResult);

      expect(timeOffRepository.update).toHaveBeenCalledWith('time-off-id', {
        startDate: undefined,
        endDate: undefined,
        reason: 'Viagem',
        updatedAt: expect.any(Date) as Date,
      });
    });
  });

  describe('remove', () => {
    it('returns null when the time off does not exist', async () => {
      timeOffRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id', userId)).resolves.toBeNull();
      expect(timeOffRepository.remove).not.toHaveBeenCalled();
    });

    it('removes the time off when it belongs to the user', async () => {
      const timeOff = { id: 'time-off-id' } as TimeOffEntity;

      timeOffRepository.findOne.mockResolvedValue(timeOff);
      timeOffRepository.remove.mockResolvedValue(timeOff);

      await expect(service.remove('time-off-id', userId)).resolves.toEqual(
        timeOff,
      );
      expect(timeOffRepository.remove).toHaveBeenCalledWith(timeOff);
    });
  });
});
