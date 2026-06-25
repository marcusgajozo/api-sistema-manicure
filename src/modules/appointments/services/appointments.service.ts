import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { I18nTranslations } from '@/generated/i18n.generated';

import { TimeOffEntity } from '../../time-offs/entities/time-off.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(TimeOffEntity)
    private readonly timeOffRepository: Repository<TimeOffEntity>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async verifyConflictAppointment(
    startDate: string | Date,
    endDate: string | Date,
    userId: string,
    appointmentId?: string,
  ) {
    const normalizedStartDate =
      startDate instanceof Date ? startDate : new Date(startDate);
    const normalizedEndDate =
      endDate instanceof Date ? endDate : new Date(endDate);

    const conflictCount = await this.appointmentRepository.count({
      where: {
        user: { id: userId },
        startDate: LessThan(normalizedEndDate),
        endDate: MoreThan(normalizedStartDate),
        ...(appointmentId ? { id: Not(appointmentId) } : {}),
      },
    });

    const timeOffConflictCount = await this.timeOffRepository
      .createQueryBuilder('timeOff')
      .innerJoin('timeOff.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('timeOff.startDate < :endDate', { endDate })
      .andWhere('timeOff.endDate > :startDate', { startDate })
      .getCount();

    return conflictCount > 0 || timeOffConflictCount > 0;
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
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
      userId,
    );

    if (hasConflict) {
      throw new ConflictException(
        this.i18n.translate('validation.APPOINTMENT_CONFLICT'),
      );
    }

    const appointment = this.appointmentRepository.create({
      endDate,
      startDate,
      clientName,
      phoneClient,
      procedureFollowUpDays,
      procedureName,
      procedurePrice,
      user: { id: userId },
      ...(clientId ? { client: { id: clientId } } : {}),
      ...(procedureId ? { procedure: { id: procedureId } } : {}),
    });

    return await this.appointmentRepository.save(appointment);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId: string) {
    const { limit, page } = paginationQueryDto;

    const [appointments, totalCount] =
      await this.appointmentRepository.findAndCount({
        where: { user: { id: userId } },
        skip: page - 1,
        take: limit,
      });

    return { appointments, totalCount };
  }

  async findOne(id: string, userId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!appointment) {
      throw new NotFoundException(this.i18n.translate('validation.NOT_FOUND'));
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    userId: string,
  ) {
    const appointment = await this.findOne(id, userId);

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
      userId,
      id,
    );

    if (hasConflict) {
      throw new ConflictException(
        this.i18n.translate('validation.APPOINTMENT_CONFLICT'),
      );
    }

    const updatedAt = new Date();

    return await this.appointmentRepository.update(appointment.id, {
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
  }

  async remove(id: string, userId: string) {
    const appointment = await this.findOne(id, userId);
    return await this.appointmentRepository.remove(appointment);
  }
}
