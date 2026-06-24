import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

@Entity('time_offs')
export class TimeOffEntity extends BaseEntity {
  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @ManyToOne(() => UserEntity, (user) => user.timeOffs, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((timeOff: TimeOffEntity) => timeOff.user)
  userId: string;
}
