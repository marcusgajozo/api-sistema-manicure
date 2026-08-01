import { IntersectionType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { Match } from '@/common/decorator/match.decorator';
import { i18nValidationMessageHelper } from '@/common/helper/i18n-validation-message.helper';
import { CreateUserDto } from '@/modules/users/dtos/create-user.dto';

export class SignUpCredentialsDto {
  @IsEmail(
    {},
    {
      message: i18nValidationMessageHelper('validation.INVALID_EMAIL'),
    },
  )
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  email!: string;

  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  password!: string;

  @IsString({
    message: i18nValidationMessageHelper('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessageHelper('validation.NOT_EMPTY'),
  })
  @Match('password', {
    message: i18nValidationMessageHelper('validation.FIELDS_MUST_MATCH'),
  })
  passwordConfirm!: string;
}

export class SignUpDto extends IntersectionType(
  CreateUserDto,
  SignUpCredentialsDto,
) {}
