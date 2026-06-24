import { IsEnum, IsMilitaryTime, IsNotEmpty } from 'class-validator';

import { IsBeforeTime } from '@/common/decorator/is-before-time.decorator';
import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

import { DayOfWeek } from '../../../common/enums/day-of-week.enum';

export class CreateScheduleTemplateDto {
  @IsEnum(DayOfWeek, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  dayOfWeek: DayOfWeek;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMilitaryTime({
    message: i18nValidationMessage('validation.INVALID_DATE_STRING'),
  })
  @IsBeforeTime('endTime', {
    message: i18nValidationMessage('validation.START_BEFORE_END_TIME'),
  })
  startTime: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMilitaryTime({
    message: i18nValidationMessage('validation.INVALID_DATE_STRING'),
  })
  endTime: string;
}
