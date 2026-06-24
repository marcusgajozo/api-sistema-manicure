import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from './dto/update-schedule-template.dto';
import { ScheduleTemplateEntity } from './entities/schedule-template.entity';
import { DayOfWeek } from '@/common/enums/day-of-week.enum';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';

@Injectable()
export class ScheduleTemplatesService {
  constructor(
    @InjectRepository(ScheduleTemplateEntity)
    private readonly scheduleTemplateRepository: Repository<ScheduleTemplateEntity>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async verifyConflictTemplate(
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    userId: string,
    scheduleTemplateId?: string,
  ) {
    const scheduleTemplateQuery = this.scheduleTemplateRepository
      .createQueryBuilder('template')
      .where('template.user.id = :userId', { userId })
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
    userId: string,
  ) {
    const { dayOfWeek, endTime, startTime } = createScheduleTemplateDto;

    const hasConflict = await this.verifyConflictTemplate(
      dayOfWeek,
      startTime,
      endTime,
      userId,
    );

    if (hasConflict) {
      throw new ConflictException(
        this.i18n.translate('validation.SCHEDULE_TEMPLATE_CONFLICT'),
      );
    }

    const scheduleTemplate = this.scheduleTemplateRepository.create({
      dayOfWeek,
      endTime,
      startTime,
      user: { id: userId },
    });

    return await this.scheduleTemplateRepository.save(scheduleTemplate);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId: string) {
    const { limit, page } = paginationQueryDto;

    const [scheduleTemplates, totalCount] =
      await this.scheduleTemplateRepository.findAndCount({
        where: { user: { id: userId } },
        skip: page - 1,
        take: limit,
      });

    return { scheduleTemplates, totalCount };
  }

  async findOne(id: string, userId: string) {
    const scheduleTemplate = await this.scheduleTemplateRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!scheduleTemplate) {
      throw new NotFoundException(this.i18n.translate('validation.NOT_FOUND'));
    }

    return scheduleTemplate;
  }

  async update(
    id: string,
    updateScheduleTemplateDto: UpdateScheduleTemplateDto,
    userId: string,
  ) {
    const scheduleTemplate = await this.findOne(id, userId);

    const { dayOfWeek, endTime, startTime } = updateScheduleTemplateDto;

    const hasConflict = await this.verifyConflictTemplate(
      dayOfWeek ?? scheduleTemplate.dayOfWeek,
      startTime ?? scheduleTemplate.startTime,
      endTime ?? scheduleTemplate.endTime,
      userId,
      id,
    );

    if (hasConflict) {
      throw new ConflictException(
        this.i18n.translate('validation.SCHEDULE_TEMPLATE_CONFLICT'),
      );
    }

    const updatedAt = new Date();

    return await this.scheduleTemplateRepository.update(scheduleTemplate.id, {
      dayOfWeek,
      endTime,
      startTime,
      updatedAt,
    });
  }

  async remove(id: string, userId: string) {
    const scheduleTemplate = await this.findOne(id, userId);
    return await this.scheduleTemplateRepository.remove(scheduleTemplate);
  }
}
