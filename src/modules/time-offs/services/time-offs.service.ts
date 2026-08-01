import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';

@Injectable()
export class TimeOffsService {
  constructor(
    @InjectRepository(TimeOffEntity)
    private readonly timeOffRepository: Repository<TimeOffEntity>,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async create(createTimeOffDto: CreateTimeOffDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { endDate, reason, startDate } = createTimeOffDto;

    const timeOff = this.timeOffRepository.create({
      endDate,
      reason,
      startDate,
      user: { id: currentUserId },
    });

    return await this.timeOffRepository.save(timeOff);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { limit, page } = paginationQueryDto;

    const [timeOffs, totalCount] = await this.timeOffRepository.findAndCount({
      where: { user: { id: currentUserId } },
      skip: page - 1,
      take: limit,
    });

    return { timeOffs, totalCount };
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const timeOff = await this.timeOffRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });

    return timeOff;
  }

  async update(
    id: string,
    updateTimeOffDto: UpdateTimeOffDto,
    userId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const timeOff = await this.findOne(id, currentUserId);

    if (!timeOff) {
      return timeOff;
    }

    const { endDate, reason, startDate } = updateTimeOffDto;
    const updatedAt = new Date();

    return await this.timeOffRepository.update(timeOff.id, {
      endDate,
      reason,
      startDate,
      updatedAt,
    });
  }

  async remove(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const timeOff = await this.findOne(id, currentUserId);

    if (!timeOff) {
      return timeOff;
    }

    return await this.timeOffRepository.remove(timeOff);
  }
}
