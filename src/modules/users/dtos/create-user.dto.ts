import { IsNotEmpty, IsString } from 'class-validator';

import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';

export class CreateUserDto {
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
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  phone: string;
}
