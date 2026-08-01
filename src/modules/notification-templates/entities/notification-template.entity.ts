import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { NotificationTypeEnum } from '@/modules/notifications/enums/notification-type.enum';
import { UserEntity } from '@/modules/users/entities/user.entity';

@Entity('notification_templates')
export class NotificationTemplateEntity extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @RelationId((template: NotificationTemplateEntity) => template.user)
  userId: string;
}
