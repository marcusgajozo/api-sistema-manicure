import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';
import { CreateUserDto } from '@/modules/users/dtos/create-user.dto';

export class SignUpDto extends CreateUserDto {
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

  @IsString({
    message: i18nValidationMessage('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  passwordConfirm: string;
}
