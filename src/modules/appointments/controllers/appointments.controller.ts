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
    const appointment =
      await this.appointmentsService.create(createScheduleDto);
    if (!appointment) {
      throw new ConflictException('validation.APPOINTMENT_CONFLICT');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    const { limit, page, startDate, endDate } = paginationQueryDto;

    const { appointments, totalCount } = await this.appointmentsService.findAll(
      {
        limit,
        page,
        startDate,
        endDate,
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
    if (!appointment) {
      throw new NotFoundException();
    }

    return new ResponseDto(appointment);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.findOne(id);
    if (!appointment) {
      throw new NotFoundException();
    }

    const updated = await this.appointmentsService.update(
      id,
      updateAppointmentDto,
    );
    if (!updated) {
      throw new ConflictException('validation.APPOINTMENT_CONFLICT');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', VerifyUUIDIdPipe) id: string) {
    const appointment = await this.appointmentsService.remove(id);
    if (!appointment) {
      throw new NotFoundException();
    }
  }
}
