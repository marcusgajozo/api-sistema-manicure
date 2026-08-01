import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';

export class SignInDto {
  @IsEmail(
    {},
    {
      message: i18nValidationMessageHelper('validation.INVALID_EMAIL'),
    },
  )
  email: string;

  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  password: string;
}
