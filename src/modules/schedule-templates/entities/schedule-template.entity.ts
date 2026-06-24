import { BaseEntity } from '@/common/entities/base.entity';
import { DayOfWeek } from '@/common/enums/day-of-week.enum';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

@Entity('schedule_templates')
export class ScheduleTemplateEntity extends BaseEntity {
  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ManyToOne(() => UserEntity, (user) => user.scheduleTemplates, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId(
    (scheduleTemplate: ScheduleTemplateEntity) => scheduleTemplate.user,
  )
  userId: string;
}
