import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

import { authenticationConfig } from '../configs/authentication.config';
import { SignInDto } from '../dtos/sign-in.dto';
import { SignUpDto } from '../dtos/sign-up.dto';
import { AuthenticationService } from '../services/authentication.service';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let authService: jest.Mocked<
    Pick<AuthenticationService, 'signIn' | 'signUp'>
  >;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;

  const authConfig = {
    secret: 'configured-secret',
    expiresIn: '1h',
    cookie: {
      name: 'access_token',
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 3_600_000,
    },
  };

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
    };
    i18n = {
      translate: jest.fn((key: string) => key),
    } as unknown as jest.Mocked<Pick<I18nService, 'translate'>>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authService,
        },
        {
          provide: authenticationConfig.KEY,
          useValue: authConfig,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('sets httpOnly cookie and returns user data without token', async () => {
      authService.signIn.mockResolvedValue({
        userId: 'user-id',
        email: signInDto.email,
        accessToken: 'signed-jwt',
      });

      const cookie = jest.fn();
      const response = { cookie } as unknown as Response;

      const result = await controller.signIn(signInDto, response);

      expect(cookie).toHaveBeenCalledWith('access_token', 'signed-jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3_600_000,
      });
      expect(result).toEqual({
        data: {
          userId: 'user-id',
          email: signInDto.email,
        },
      });
    });

    it('throws UnauthorizedException when credentials are invalid', async () => {
      authService.signIn.mockResolvedValue(null);

      const cookie = jest.fn();
      const response = { cookie } as unknown as Response;

      await expect(controller.signIn(signInDto, response)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.UNAUTHORIZED');
      expect(cookie).not.toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      name: 'Jane Doe',
      phone: '11999999999',
      email: 'jane@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
    };

    it('creates account when email is available', async () => {
      authService.signUp.mockResolvedValue({
        id: 'auth-id',
        userId: 'user-id',
        email: signUpDto.email,
        passwordHash: 'hashed-password',
      } as never);

      await expect(controller.signUp(signUpDto)).resolves.toBeUndefined();
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });

    it('throws ConflictException when email already exists', async () => {
      authService.signUp.mockResolvedValue(null);

      await expect(controller.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.EMAIL_EXISTS');
    });
  });
});
