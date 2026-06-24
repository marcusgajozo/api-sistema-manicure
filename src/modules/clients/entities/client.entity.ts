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

@Entity('clients')
export class ClientEntity extends BaseEntity {
  @Column()
  name: string;

  @Column()
  phone: string;

  @ManyToOne(() => UserEntity, (user) => user.clients, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((client: ClientEntity) => client.user)
  userId: string;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.client)
  appointments: AppointmentEntity[];
}
