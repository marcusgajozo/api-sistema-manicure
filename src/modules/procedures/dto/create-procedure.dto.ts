import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';

export class CreateProcedureDto {
  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  name: string;

  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsOptional()
  description?: string;

  @IsInt({
    message: i18nValidationMessageHelper('validation.INVALID_INT'),
  })
  @Min(0)
  price: number;

  @IsInt({
    message: i18nValidationMessageHelper('validation.INVALID_INT'),
  })
  @Min(0)
  returnDays: number;

  @IsInt({
    message: i18nValidationMessageHelper('validation.INVALID_INT'),
  })
  @Min(0)
  durationMinutes: number;
}
