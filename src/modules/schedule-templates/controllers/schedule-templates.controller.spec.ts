import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { DayOfWeek } from '@/common/enums/day-of-week.enum';

import { CreateScheduleTemplateDto } from '../dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from '../dto/update-schedule-template.dto';
import { ScheduleTemplateEntity } from '../entities/schedule-template.entity';
import { ScheduleTemplatesService } from '../services/schedule-templates.service';
import { ScheduleTemplatesController } from './schedule-templates.controller';

describe('ScheduleTemplatesController', () => {
  let controller: ScheduleTemplatesController;
  let scheduleTemplatesService: jest.Mocked<
    Pick<
      ScheduleTemplatesService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;

  beforeEach(async () => {
    scheduleTemplatesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleTemplatesController],
      providers: [
        {
          provide: ScheduleTemplatesService,
          useValue: scheduleTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<ScheduleTemplatesController>(
      ScheduleTemplatesController,
    );
  });

  describe('create', () => {
    const createScheduleTemplateDto: CreateScheduleTemplateDto = {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '12:00',
    };

    it('creates a schedule template for the authenticated user', async () => {
      scheduleTemplatesService.create.mockResolvedValue({
        id: 'template-id',
      } as ScheduleTemplateEntity);

      await expect(
        controller.create(createScheduleTemplateDto),
      ).resolves.toBeUndefined();
      expect(scheduleTemplatesService.create).toHaveBeenCalledWith(
        createScheduleTemplateDto,
      );
    });

    it('propagates ConflictException when templates overlap', async () => {
      scheduleTemplatesService.create.mockResolvedValue(null as never);

      await expect(
        controller.create(createScheduleTemplateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated schedule templates', async () => {
      const scheduleTemplates = [
        { id: 'template-id' },
      ] as ScheduleTemplateEntity[];

      scheduleTemplatesService.findAll.mockResolvedValue({
        scheduleTemplates,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(
        new PaginatedResponseDto(scheduleTemplates, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(scheduleTemplatesService.findAll).toHaveBeenCalledWith({
        limit: 10,
        page: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns a schedule template when it exists', async () => {
      const scheduleTemplate = { id: 'template-id' } as ScheduleTemplateEntity;

      scheduleTemplatesService.findOne.mockResolvedValue(scheduleTemplate);

      const result = await controller.findOne('template-id');

      expect(result).toEqual(new ResponseDto(scheduleTemplate));
    });

    it('throws NotFoundException when the schedule template does not exist', async () => {
      scheduleTemplatesService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateScheduleTemplateDto: UpdateScheduleTemplateDto = {
      startTime: '10:00',
    };

    it('updates a schedule template when it exists', async () => {
      scheduleTemplatesService.findOne.mockResolvedValue({
        id: 'template-id',
      } as ScheduleTemplateEntity);
      scheduleTemplatesService.update.mockResolvedValue({
        affected: 1,
      } as never);

      await expect(
        controller.update('template-id', updateScheduleTemplateDto),
      ).resolves.toBeUndefined();
      expect(scheduleTemplatesService.update).toHaveBeenCalledWith(
        'template-id',
        updateScheduleTemplateDto,
      );
    });

    it('throws NotFoundException when the schedule template does not exist', async () => {
      scheduleTemplatesService.findOne.mockResolvedValue(null);

      await expect(
        controller.update('missing-id', updateScheduleTemplateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates ConflictException when the update overlaps another template', async () => {
      scheduleTemplatesService.findOne.mockResolvedValue({
        id: 'template-id',
      } as ScheduleTemplateEntity);
      scheduleTemplatesService.update.mockResolvedValue(null as never);

      await expect(
        controller.update('template-id', updateScheduleTemplateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes a schedule template when it exists', async () => {
      scheduleTemplatesService.remove.mockResolvedValue({
        id: 'template-id',
      } as ScheduleTemplateEntity);

      await expect(controller.remove('template-id')).resolves.toBeUndefined();
      expect(scheduleTemplatesService.remove).toHaveBeenCalledWith(
        'template-id',
      );
    });

    it('throws NotFoundException when the schedule template does not exist', async () => {
      scheduleTemplatesService.remove.mockResolvedValue(null);

      await expect(controller.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
