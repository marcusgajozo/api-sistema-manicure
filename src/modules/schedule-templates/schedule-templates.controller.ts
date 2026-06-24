import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UserAuth } from '@/common/decorator/user-auth.decorator';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';

import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from './dto/update-schedule-template.dto';
import { ScheduleTemplatesService } from './schedule-templates.service';

@ApiBearerAuth()
@Controller('schedule-templates')
export class ScheduleTemplatesController {
  constructor(
    private readonly scheduleTemplatesService: ScheduleTemplatesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createScheduleDto: CreateScheduleTemplateDto,
    @UserAuth('userId') userId: string,
  ) {
    void (await this.scheduleTemplatesService.create(
      createScheduleDto,
      userId,
    ));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @UserAuth('userId') userId: string,
  ) {
    const { limit, page } = paginationQueryDto;

    const { scheduleTemplates, totalCount } =
      await this.scheduleTemplatesService.findAll({ limit, page }, userId);

    return new PaginatedResponseDto(scheduleTemplates, {
      page,
      limit,
      totalCount,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @UserAuth('userId') userId: string,
  ) {
    const scheduleTemplate = await this.scheduleTemplatesService.findOne(
      id,
      userId,
    );

    return new ResponseDto(scheduleTemplate);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateScheduleTemplateDto: UpdateScheduleTemplateDto,
    @UserAuth('userId') userId: string,
  ) {
    void (await this.scheduleTemplatesService.update(
      id,
      updateScheduleTemplateDto,
      userId,
    ));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @UserAuth('userId') userId: string,
  ) {
    void (await this.scheduleTemplatesService.remove(id, userId));
  }
}
