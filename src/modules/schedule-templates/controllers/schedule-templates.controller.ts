import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';

import { CreateScheduleTemplateDto } from '../dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from '../dto/update-schedule-template.dto';
import { ScheduleTemplatesService } from '../services/schedule-templates.service';

@ApiBearerAuth()
@Controller('schedule-templates')
export class ScheduleTemplatesController {
  constructor(
    private readonly scheduleTemplatesService: ScheduleTemplatesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createScheduleDto: CreateScheduleTemplateDto) {
    const template =
      await this.scheduleTemplatesService.create(createScheduleDto);
    if (!template) {
      throw new ConflictException('validation.SCHEDULE_TEMPLATE_CONFLICT');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    const { limit, page } = paginationQueryDto;

    const { scheduleTemplates, totalCount } =
      await this.scheduleTemplatesService.findAll({ limit, page });

    return new PaginatedResponseDto(scheduleTemplates, {
      page,
      limit,
      totalCount,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', VerifyUUIDIdPipe) id: string) {
    const scheduleTemplate = await this.scheduleTemplatesService.findOne(id);

    if (!scheduleTemplate) {
      throw new NotFoundException();
    }

    return new ResponseDto(scheduleTemplate);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateScheduleTemplateDto: UpdateScheduleTemplateDto,
  ) {
    const scheduleTemplate = await this.scheduleTemplatesService.findOne(id);
    if (!scheduleTemplate) {
      throw new NotFoundException();
    }

    const updated = await this.scheduleTemplatesService.update(
      id,
      updateScheduleTemplateDto,
    );

    if (!updated) {
      throw new ConflictException('validation.SCHEDULE_TEMPLATE_CONFLICT');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', VerifyUUIDIdPipe) id: string) {
    const scheduleTemplate = await this.scheduleTemplatesService.remove(id);

    if (!scheduleTemplate) {
      throw new NotFoundException();
    }
  }
}
