import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

import { Public } from '@/common/decorator/public.decorator';
import { ResponseDto } from '@/common/dtos/response.dto';
import { I18nTranslations } from '@/generated/i18n.generated';

import {
  AuthenticationConfig,
  authenticationConfig,
} from '../configs/authentication.config';
import { SignInDto } from '../dtos/sign-in.dto';
import { SignUpDto } from '../dtos/sign-up.dto';
import { AuthenticationService } from '../services/authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(signInDto);

    if (!result) {
      throw new UnauthorizedException(
        this.i18n.translate('validation.UNAUTHORIZED'),
      );
    }

    const authConfig = this.configService.getOrThrow<AuthenticationConfig>(
      authenticationConfig.KEY,
    );
    const { name, ...cookieOptions } = authConfig.cookie;

    response.cookie(name, result.accessToken, cookieOptions);

    return new ResponseDto({
      userId: result.userId,
      email: result.email,
    });
  }

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);

    if (!user) {
      throw new ConflictException(
        this.i18n.translate('validation.EMAIL_EXISTS'),
      );
    }
  }
}
