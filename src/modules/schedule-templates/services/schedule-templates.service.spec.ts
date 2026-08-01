import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';

import { DayOfWeek } from '@/common/enums/day-of-week.enum';

import { CreateScheduleTemplateDto } from '../dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from '../dto/update-schedule-template.dto';
import { ScheduleTemplateEntity } from '../entities/schedule-template.entity';
import { ScheduleTemplatesService } from './schedule-templates.service';

describe('ScheduleTemplatesService', () => {
  let service: ScheduleTemplatesService;
  let scheduleTemplateRepository: jest.Mocked<
    Pick<
      Repository<ScheduleTemplateEntity>,
      | 'create'
      | 'save'
      | 'findAndCount'
      | 'findOne'
      | 'update'
      | 'remove'
      | 'createQueryBuilder'
    >
  >;
  let queryBuilder: jest.Mocked<
    Pick<
      SelectQueryBuilder<ScheduleTemplateEntity>,
      'where' | 'andWhere' | 'getCount'
    >
  >;

  const userId = 'user-id';

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    };

    scheduleTemplateRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleTemplatesService,
        {
          provide: getRepositoryToken(ScheduleTemplateEntity),
          useValue: scheduleTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduleTemplatesService>(ScheduleTemplatesService);
  });

  describe('verifyConflictTemplate', () => {
    it('returns true when overlapping templates exist', async () => {
      queryBuilder.getCount.mockResolvedValue(1);

      await expect(
        service.verifyConflictTemplate(
          DayOfWeek.MONDAY,
          '09:00',
          '12:00',
          userId,
        ),
      ).resolves.toBe(true);

      expect(
        scheduleTemplateRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('template');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'template.user.id = :userId',
        { userId },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'template.dayOfWeek = :dayOfWeek',
        { dayOfWeek: DayOfWeek.MONDAY },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'template.startTime < :endTime',
        { endTime: '12:00' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'template.endTime > :startTime',
        { startTime: '09:00' },
      );
    });

    it('returns false when no overlapping templates exist', async () => {
      queryBuilder.getCount.mockResolvedValue(0);

      await expect(
        service.verifyConflictTemplate(
          DayOfWeek.MONDAY,
          '09:00',
          '12:00',
          userId,
        ),
      ).resolves.toBe(false);
    });

    it('excludes the current template when scheduleTemplateId is provided', async () => {
      queryBuilder.getCount.mockResolvedValue(0);

      await expect(
        service.verifyConflictTemplate(
          DayOfWeek.MONDAY,
          '09:00',
          '12:00',
          userId,
          'template-id',
        ),
      ).resolves.toBe(false);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'template.id != :scheduleTemplateId',
        { scheduleTemplateId: 'template-id' },
      );
    });
  });

  describe('create', () => {
    const createScheduleTemplateDto: CreateScheduleTemplateDto = {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '12:00',
    };

    it('creates and persists a schedule template for the authenticated user', async () => {
      const createdTemplate = {
        dayOfWeek: createScheduleTemplateDto.dayOfWeek,
        startTime: createScheduleTemplateDto.startTime,
        endTime: createScheduleTemplateDto.endTime,
        user: { id: userId },
      } as ScheduleTemplateEntity;
      const savedTemplate = {
        ...createdTemplate,
        id: 'template-id',
      } as ScheduleTemplateEntity;

      queryBuilder.getCount.mockResolvedValue(0);
      scheduleTemplateRepository.create.mockReturnValue(createdTemplate);
      scheduleTemplateRepository.save.mockResolvedValue(savedTemplate);

      await expect(
        service.create(createScheduleTemplateDto, userId),
      ).resolves.toEqual(savedTemplate);

      expect(scheduleTemplateRepository.create).toHaveBeenCalledWith({
        dayOfWeek: createScheduleTemplateDto.dayOfWeek,
        startTime: createScheduleTemplateDto.startTime,
        endTime: createScheduleTemplateDto.endTime,
        user: { id: userId },
      });
      expect(scheduleTemplateRepository.save).toHaveBeenCalledWith(
        createdTemplate,
      );
    });

    it('returns null when templates overlap', async () => {
      queryBuilder.getCount.mockResolvedValue(1);

      await expect(
        service.create(createScheduleTemplateDto, userId),
      ).resolves.toBeNull();
      expect(scheduleTemplateRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated schedule templates for the authenticated user', async () => {
      const scheduleTemplates = [
        { id: 'template-id' },
      ] as ScheduleTemplateEntity[];

      scheduleTemplateRepository.findAndCount.mockResolvedValue([
        scheduleTemplates,
        1,
      ]);

      await expect(
        service.findAll({ page: 2, limit: 5 }, userId),
      ).resolves.toEqual({
        scheduleTemplates,
        totalCount: 1,
      });

      expect(scheduleTemplateRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        skip: 1,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('returns a schedule template when it belongs to the user', async () => {
      const scheduleTemplate = { id: 'template-id' } as ScheduleTemplateEntity;

      scheduleTemplateRepository.findOne.mockResolvedValue(scheduleTemplate);

      await expect(service.findOne('template-id', userId)).resolves.toEqual(
        scheduleTemplate,
      );

      expect(scheduleTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-id', user: { id: userId } },
      });
    });

    it('returns null when the schedule template does not exist', async () => {
      scheduleTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', userId)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    const updateScheduleTemplateDto: UpdateScheduleTemplateDto = {
      startTime: '10:00',
    };

    it('updates the schedule template when it belongs to the user', async () => {
      const scheduleTemplate = {
        id: 'template-id',
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '12:00',
      } as ScheduleTemplateEntity;
      const updateResult = { affected: 1 } as UpdateResult;

      scheduleTemplateRepository.findOne.mockResolvedValue(scheduleTemplate);
      queryBuilder.getCount.mockResolvedValue(0);
      scheduleTemplateRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.update('template-id', updateScheduleTemplateDto, userId),
      ).resolves.toEqual(updateResult);

      expect(scheduleTemplateRepository.update).toHaveBeenCalledWith(
        'template-id',
        {
          dayOfWeek: undefined,
          startTime: '10:00',
          endTime: undefined,
          updatedAt: expect.any(Date) as Date,
        },
      );
    });

    it('returns null when the update overlaps another template', async () => {
      const scheduleTemplate = {
        id: 'template-id',
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '12:00',
      } as ScheduleTemplateEntity;

      scheduleTemplateRepository.findOne.mockResolvedValue(scheduleTemplate);
      queryBuilder.getCount.mockResolvedValue(1);

      await expect(
        service.update('template-id', updateScheduleTemplateDto, userId),
      ).resolves.toBeNull();
      expect(scheduleTemplateRepository.update).not.toHaveBeenCalled();
    });

    it('returns null when the schedule template does not exist', async () => {
      scheduleTemplateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', updateScheduleTemplateDto, userId),
      ).resolves.toBeNull();
      expect(scheduleTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes the schedule template when it belongs to the user', async () => {
      const scheduleTemplate = { id: 'template-id' } as ScheduleTemplateEntity;

      scheduleTemplateRepository.findOne.mockResolvedValue(scheduleTemplate);
      scheduleTemplateRepository.remove.mockResolvedValue(scheduleTemplate);

      await expect(service.remove('template-id', userId)).resolves.toEqual(
        scheduleTemplate,
      );
      expect(scheduleTemplateRepository.remove).toHaveBeenCalledWith(
        scheduleTemplate,
      );
    });

    it('returns null when the schedule template does not exist', async () => {
      scheduleTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id', userId)).resolves.toBeNull();
      expect(scheduleTemplateRepository.remove).not.toHaveBeenCalled();
    });
  });
});
