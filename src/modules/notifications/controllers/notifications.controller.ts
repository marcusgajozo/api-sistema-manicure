import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';

import { NotificationsService } from '../services/notifications.service';

@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    const { limit, page, startDate, endDate } = paginationQueryDto;

    const { notifications, totalCount } =
      await this.notificationsService.findAll({
        limit,
        page,
        startDate,
        endDate,
      });

    return new PaginatedResponseDto(notifications, {
      page,
      limit,
      totalCount,
    });
  }
}
