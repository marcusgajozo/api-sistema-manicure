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

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';

import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentsService } from '../services/appointments.service';

@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createScheduleDto: CreateAppointmentDto) {
    void (await this.appointmentsService.create(createScheduleDto));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    const { limit, page } = paginationQueryDto;

    const { appointments, totalCount } = await this.appointmentsService.findAll(
      {
        limit,
        page,
      },
    );

    return new PaginatedResponseDto(appointments, {
      page,
      limit,
      totalCount,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', VerifyUUIDIdPipe) id: string) {
    const appointment = await this.appointmentsService.findOne(id);

    return new ResponseDto(appointment);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    void (await this.appointmentsService.update(id, updateAppointmentDto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', VerifyUUIDIdPipe) id: string) {
    void (await this.appointmentsService.remove(id));
  }
}
