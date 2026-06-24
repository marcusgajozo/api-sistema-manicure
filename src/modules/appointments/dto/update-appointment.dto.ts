import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

import { NotifyReturnClientEnum } from '../enums/notify-client.enum';
import { StatusAppointmentEnum } from '../enums/status-appointment.enum';
import { CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsEnum(NotifyReturnClientEnum, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  notifyReturnClient?: NotifyReturnClientEnum;

  @IsOptional()
  @IsEnum(StatusAppointmentEnum, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  statusAppointment?: StatusAppointmentEnum;
}
