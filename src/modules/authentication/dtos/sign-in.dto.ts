import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

export class SignInDto {
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('validation.INVALID_EMAIL'),
    },
  )
  email: string;

  @IsString({
    message: i18nValidationMessage('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  password: string;
}
