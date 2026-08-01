import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

import { IsBeforeDate } from '@/common/decorator/is-before-date.decorator';
import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';

export class CreateAppointmentDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessageHelper('validation.INVALID_UUID'),
  })
  procedureId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.procedureId)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsString()
  procedureName?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.procedureId)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsInt({ message: i18nValidationMessageHelper('validation.INVALID_INT') })
  procedurePrice?: number;

  @IsOptional()
  @IsInt()
  procedureFollowUpDays?: number;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessageHelper('validation.INVALID_UUID'),
  })
  clientId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.clientId)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsString()
  clientName?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.clientId)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsString()
  phoneClient?: string;

  @Type(() => Date)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsDate({
    message: i18nValidationMessageHelper('validation.INVALID_DATE_STRING'),
  })
  @IsBeforeDate('endDate', {
    message: i18nValidationMessageHelper('validation.IVALID_BEFORE_DATE'),
  })
  startDate!: Date;

  @Type(() => Date)
  @IsNotEmpty({ message: i18nValidationMessageHelper('validation.NOT_EMPTY') })
  @IsDate({
    message: i18nValidationMessageHelper('validation.INVALID_DATE_STRING'),
  })
  endDate!: Date;
}
