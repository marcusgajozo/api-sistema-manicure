import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

import { IsBeforeDate } from '@/common/decorator/is-before-date.decorator';
import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

export class CreateTimeOffDto {
  @Type(() => Date)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsDate({ message: i18nValidationMessage('validation.INVALID_DATE_STRING') })
  @IsBeforeDate('endDate', {
    message: i18nValidationMessage('validation.IVALID_BEFORE_DATE'),
  })
  startDate!: Date;

  @Type(() => Date)
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsDate({ message: i18nValidationMessage('validation.INVALID_DATE_STRING') })
  endDate!: Date;

  @IsString({
    message: i18nValidationMessage('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  reason!: string;
}
