import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';

import { AppointmentEntity } from '../../appointments/entities/appointment.entity';
import { NotificationStatusEnum } from '../enums/notification-status.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @Column({
    type: 'enum',
    enum: NotificationStatusEnum,
    default: NotificationStatusEnum.PENDING,
  })
  status: NotificationStatusEnum;

  @Column({ type: 'timestamptz' })
  scheduledFor: Date;

  @ManyToOne(() => AppointmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;
}
