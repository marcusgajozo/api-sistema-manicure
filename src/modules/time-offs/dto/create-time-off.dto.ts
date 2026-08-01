import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

import { IsBeforeDate } from '@/common/decorator/is-before-date.decorator';
import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';

export class CreateTimeOffDto {
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

  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  reason!: string;
}
