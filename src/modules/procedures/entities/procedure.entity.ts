import { BaseEntity } from '@/common/entities/base.entity';
import { AppointmentEntity } from '@/modules/appointments/entities/appointment.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';

@Entity('procedures')
export class ProcedureEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ name: 'return_days', type: 'int', default: 0 })
  returnDays: number;

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @ManyToOne(() => UserEntity, (user) => user.procedures, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((procedure: ProcedureEntity) => procedure.user)
  userId: string;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.procedure)
  appointments: AppointmentEntity[];

  @RelationId((procedure: ProcedureEntity) => procedure.appointments)
  appointmentIds: string[];
}
