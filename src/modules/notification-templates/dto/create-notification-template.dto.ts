import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { NotificationTypeEnum } from '@/modules/notifications/enums/notification-type.enum';

export class CreateNotificationTemplateDto {
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type: NotificationTypeEnum;

  @IsString()
  @IsNotEmpty()
  content: string;
}
