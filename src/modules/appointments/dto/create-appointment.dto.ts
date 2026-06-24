import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { IsBeforeDate } from '@/common/decorator/is-before-date.decorator';
import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

export class CreateAppointmentDto {
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.INVALID_UUID') })
  procedureId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.procedureId)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString()
  procedureName?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.procedureId)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsInt({ message: i18nValidationMessage('validation.INVALID_INT') })
  procedurePrice?: number;

  @IsOptional()
  @IsInt()
  procedureFollowUpDays?: number;

  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.INVALID_UUID') })
  clientId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.clientId)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString()
  clientName?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.clientId)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString()
  phoneClient?: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsISO8601(
    {},
    { message: i18nValidationMessage('validation.INVALID_DATE_STRING') },
  )
  @IsBeforeDate('endDate', {
    message: i18nValidationMessage('validation.IVALID_BEFORE_DATE'),
  })
  startDate: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsISO8601(
    {},
    { message: i18nValidationMessage('validation.INVALID_DATE_STRING') },
  )
  endDate: string;
}
