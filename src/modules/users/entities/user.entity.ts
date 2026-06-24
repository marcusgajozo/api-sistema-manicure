import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { AppointmentEntity } from '@/modules/appointments/entities/appointment.entity';
import { ClientEntity } from '@/modules/clients/entities/client.entity';
import { ProcedureEntity } from '@/modules/procedures/entities/procedure.entity';
import { ScheduleTemplateEntity } from '@/modules/schedule-templates/entities/schedule-template.entity';
import { TimeOffEntity } from '@/modules/time-offs/entities/time-off.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column()
  name: string;

  @Column()
  phone: string;

  @OneToMany(() => ProcedureEntity, (procedure) => procedure.user)
  procedures: ProcedureEntity[];

  @OneToMany(() => ClientEntity, (client) => client.user)
  clients: ClientEntity[];

  @OneToMany(() => TimeOffEntity, (timeOff) => timeOff.user)
  timeOffs: TimeOffEntity[];

  @OneToMany(
    () => ScheduleTemplateEntity,
    (scheduleTemplate) => scheduleTemplate.user,
  )
  scheduleTemplates: ScheduleTemplateEntity[];

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.user)
  appointments: AppointmentEntity[];
}
