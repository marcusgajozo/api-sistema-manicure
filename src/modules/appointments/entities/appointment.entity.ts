import { BaseEntity } from '@/common/entities/base.entity';
import { ClientEntity } from '@/modules/clients/entities/client.entity';
import { ProcedureEntity } from '@/modules/procedures/entities/procedure.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { NotifyReturnClientEnum } from '../enums/notify-client.enum';
import { StatusAppointmentEnum } from '../enums/status-appointment.enum';

@Entity('appointments')
export class AppointmentEntity extends BaseEntity {
  @Column({ name: 'procedure_name', nullable: true })
  procedureName?: string;

  @Column({ name: 'procedure_price', type: 'int', nullable: true })
  procedurePrice?: number;

  @Column({ name: 'procedure_follow_up_days', type: 'int', nullable: true })
  procedureFollowUpDays?: number;

  @Column({ name: 'client_name', nullable: true })
  clientName?: string;

  @Column({ name: 'phone_client', nullable: true })
  phoneClient?: string;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: string;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: NotifyReturnClientEnum,
    default: NotifyReturnClientEnum.PENDING_NOTIFICATION,
    name: 'notify_client',
  })
  notifyReturnClient: NotifyReturnClientEnum;

  @Column({
    type: 'enum',
    enum: StatusAppointmentEnum,
    default: StatusAppointmentEnum.SCHEDULED,
    name: 'status_appointment',
  })
  statusAppointment: StatusAppointmentEnum;

  @ManyToOne(() => ClientEntity, (client) => client.appointments, {
    nullable: true,
  })
  @JoinColumn({ name: 'client_id' })
  client?: ClientEntity;

  @RelationId((appointment: AppointmentEntity) => appointment.client)
  clientId?: string;

  @ManyToOne(() => ProcedureEntity, (procedure) => procedure.appointments, {
    nullable: true,
  })
  @JoinColumn({ name: 'procedure_id' })
  procedure?: ProcedureEntity;

  @RelationId((appointment: AppointmentEntity) => appointment.procedure)
  procedureId?: string;

  @ManyToOne(() => UserEntity, (user) => user.appointments, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @RelationId((appointment: AppointmentEntity) => appointment.user)
  userId?: string;
}
