import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { DayOfWeek } from '@/common/enums/day-of-week.enum';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

import { CreateScheduleTemplateDto } from '../dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from '../dto/update-schedule-template.dto';
import { ScheduleTemplateEntity } from '../entities/schedule-template.entity';

@Injectable()
export class ScheduleTemplatesService {
  constructor(
    @InjectRepository(ScheduleTemplateEntity)
    private readonly scheduleTemplateRepository: Repository<ScheduleTemplateEntity>,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async verifyConflictTemplate(
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    userId?: string,
    scheduleTemplateId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const scheduleTemplateQuery = this.scheduleTemplateRepository
      .createQueryBuilder('template')
      .where('template.user.id = :userId', { userId: currentUserId })
      .andWhere('template.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('template.startTime < :endTime', { endTime })
      .andWhere('template.endTime > :startTime', { startTime });

    if (scheduleTemplateId) {
      scheduleTemplateQuery.andWhere('template.id != :scheduleTemplateId', {
        scheduleTemplateId,
      });
    }

    const conflictCount = await scheduleTemplateQuery.getCount();

    return conflictCount > 0;
  }

  async create(
    createScheduleTemplateDto: CreateScheduleTemplateDto,
    userId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const { dayOfWeek, endTime, startTime } = createScheduleTemplateDto;

    const hasConflict = await this.verifyConflictTemplate(
      dayOfWeek,
      startTime,
      endTime,
      currentUserId,
    );

    if (hasConflict) {
      return null;
    }

    const scheduleTemplate = this.scheduleTemplateRepository.create({
      dayOfWeek,
      endTime,
      startTime,
      user: { id: currentUserId },
    });

    return await this.scheduleTemplateRepository.save(scheduleTemplate);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { limit, page, startDate, endDate } = paginationQueryDto;

    const whereClause: FindOptionsWhere<ScheduleTemplateEntity> = {
      user: { id: currentUserId },
    };

    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereClause.createdAt = LessThanOrEqual(endDate);
    }

    const [scheduleTemplates, totalCount] =
      await this.scheduleTemplateRepository.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'ASC' },
      });

    return { scheduleTemplates, totalCount };
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    return await this.scheduleTemplateRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });
  }

  async update(
    id: string,
    updateScheduleTemplateDto: UpdateScheduleTemplateDto,
    userId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const scheduleTemplate = await this.findOne(id, currentUserId);

    if (!scheduleTemplate) {
      return scheduleTemplate;
    }

    const { dayOfWeek, endTime, startTime } = updateScheduleTemplateDto;

    const hasConflict = await this.verifyConflictTemplate(
      dayOfWeek ?? scheduleTemplate.dayOfWeek,
      startTime ?? scheduleTemplate.startTime,
      endTime ?? scheduleTemplate.endTime,
      currentUserId,
      id,
    );

    if (hasConflict) {
      return null;
    }

    const updatedAt = new Date();

    return await this.scheduleTemplateRepository.update(scheduleTemplate.id, {
      dayOfWeek,
      endTime,
      startTime,
      updatedAt,
    });
  }

  async remove(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const scheduleTemplate = await this.findOne(id, currentUserId);

    if (!scheduleTemplate) {
      return scheduleTemplate;
    }

    return await this.scheduleTemplateRepository.remove(scheduleTemplate);
  }
}
