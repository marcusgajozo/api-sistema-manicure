import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

import { TimeOffEntity } from '../../time-offs/entities/time-off.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import {
  AppointmentCanceledEvent,
  AppointmentCreatedEvent,
  AppointmentEventEnum,
  AppointmentRescheduledEvent,
} from '../events/appointment-events';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(TimeOffEntity)
    private readonly timeOffRepository: Repository<TimeOffEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async verifyConflictAppointment(
    startDate: Date,
    endDate: Date,
    userId?: string,
    appointmentId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const conflictCount = await this.appointmentRepository.count({
      where: {
        user: { id: currentUserId },
        startDate: LessThan(endDate),
        endDate: MoreThan(startDate),
        ...(appointmentId ? { id: Not(appointmentId) } : {}),
      },
    });

    const timeOffConflictCount = await this.timeOffRepository
      .createQueryBuilder('timeOff')
      .innerJoin('timeOff.user', 'user')
      .where('user.id = :userId', { userId: currentUserId })
      .andWhere('timeOff.startDate < :endDate', { endDate })
      .andWhere('timeOff.endDate > :startDate', { startDate })
      .getCount();

    return conflictCount > 0 || timeOffConflictCount > 0;
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const {
      endDate,
      startDate,
      clientId,
      clientName,
      phoneClient,
      procedureFollowUpDays,
      procedureId,
      procedureName,
      procedurePrice,
    } = createAppointmentDto;

    const hasConflict = await this.verifyConflictAppointment(
      startDate,
      endDate,
      currentUserId,
    );

    if (hasConflict) {
      return null;
    }

    const appointment = this.appointmentRepository.create({
      endDate,
      startDate,
      clientName,
      phoneClient,
      procedureFollowUpDays,
      procedureName,
      procedurePrice,
      user: { id: currentUserId },
      ...(clientId ? { client: { id: clientId } } : {}),
      ...(procedureId ? { procedure: { id: procedureId } } : {}),
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.eventEmitter.emitAsync(
      AppointmentEventEnum.CREATED,
      new AppointmentCreatedEvent(
        savedAppointment.id,
        savedAppointment.startDate,
      ),
    );

    return savedAppointment;
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { limit, page, startDate, endDate } = paginationQueryDto;

    const whereClause: FindOptionsWhere<AppointmentEntity> = {
      user: { id: currentUserId },
    };

    if (startDate && endDate) {
      whereClause.startDate = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.startDate = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereClause.startDate = LessThanOrEqual(endDate);
    }

    const [appointments, totalCount] =
      await this.appointmentRepository.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        order: { startDate: 'ASC' },
      });

    return { appointments, totalCount };
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    userId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const appointment = await this.findOne(id, currentUserId);
    if (!appointment) return null;

    const {
      endDate,
      startDate,
      clientId,
      clientName,
      phoneClient,
      procedureFollowUpDays,
      procedureId,
      procedureName,
      procedurePrice,
      notifyReturnClient,
      statusAppointment,
    } = updateAppointmentDto;

    const hasConflict = await this.verifyConflictAppointment(
      startDate ?? appointment.startDate,
      endDate ?? appointment.endDate,
      currentUserId,
      id,
    );

    if (hasConflict) {
      return null;
    }

    const updatedAt = new Date();

    const result = await this.appointmentRepository.update(appointment.id, {
      endDate,
      startDate,
      clientName,
      phoneClient,
      procedureFollowUpDays,
      procedureName,
      procedurePrice,
      updatedAt,
      notifyReturnClient,
      statusAppointment,
      ...(clientId ? { client: { id: clientId } } : {}),
      ...(procedureId ? { procedure: { id: procedureId } } : {}),
    });

    if (startDate && startDate.getTime() !== appointment.startDate.getTime()) {
      await this.eventEmitter.emitAsync(
        AppointmentEventEnum.RESCHEDULED,
        new AppointmentRescheduledEvent(id, startDate),
      );
    }

    return result;
  }

  async remove(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const appointment = await this.findOne(id, currentUserId);
    if (!appointment) return null;
    const removed = await this.appointmentRepository.remove(appointment);

    await this.eventEmitter.emitAsync(
      AppointmentEventEnum.CANCELED,
      new AppointmentCanceledEvent(id),
    );

    return removed;
  }
}
