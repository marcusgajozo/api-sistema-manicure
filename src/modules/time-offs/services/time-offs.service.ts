import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';

import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';

@Injectable()
export class TimeOffsService {
  constructor(
    @InjectRepository(TimeOffEntity)
    private readonly timeOffRepository: Repository<TimeOffEntity>,
  ) {}

  async create(createTimeOffDto: CreateTimeOffDto, userId: string) {
    const { endDate, reason, startDate } = createTimeOffDto;

    const timeOff = this.timeOffRepository.create({
      endDate,
      reason,
      startDate,
      user: { id: userId },
    });

    return await this.timeOffRepository.save(timeOff);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId: string) {
    const { limit, page } = paginationQueryDto;

    const [timeOffs, totalCount] = await this.timeOffRepository.findAndCount({
      where: { user: { id: userId } },
      skip: page - 1,
      take: limit,
    });

    return { timeOffs, totalCount };
  }

  async findOne(id: string, userId: string) {
    const timeOff = await this.timeOffRepository.findOne({
      where: { id, user: { id: userId } },
    });

    return timeOff;
  }

  async update(id: string, updateTimeOffDto: UpdateTimeOffDto, userId: string) {
    const timeOff = await this.findOne(id, userId);

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

  async remove(id: string, userId: string) {
    const timeOff = await this.findOne(id, userId);

    if (!timeOff) {
      return timeOff;
    }

    return await this.timeOffRepository.remove(timeOff);
  }
}
