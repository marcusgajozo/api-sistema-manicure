import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from '@/common/helper/i18n-validation-message';

export class CreateClientDto {
  @IsString({
    message: i18nValidationMessage('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  name: string;

  @IsString({
    message: i18nValidationMessage('validation.INVALID_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  phone: string;
}
