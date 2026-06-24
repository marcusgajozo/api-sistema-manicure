import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '@/modules/users/users.service';

import { SignInDto } from '../dtos/sign-in.dto';
import { SignUpDto } from '../dtos/sign-up.dto';
import { AuthenticationEntity } from '../entities/authentication.entity';
import { AuthenticationService } from './authentication.service';
import { HashingService } from './hashing.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let authenticationRepository: jest.Mocked<
    Pick<Repository<AuthenticationEntity>, 'findOne' | 'save'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'create'>>;
  let hashingService: jest.Mocked<HashingService>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    authenticationRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    usersService = {
      create: jest.fn(),
    };
    hashingService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: getRepositoryToken(AuthenticationEntity),
          useValue: authenticationRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: HashingService,
          useValue: hashingService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('returns null when email is not found', async () => {
      authenticationRepository.findOne.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).resolves.toBeNull();
    });

    it('returns null when password is invalid', async () => {
      authenticationRepository.findOne.mockResolvedValue({
        email: signInDto.email,
        passwordHash: 'hashed-password',
        userId: 'user-id',
      } as AuthenticationEntity);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.signIn(signInDto)).resolves.toBeNull();
    });

    it('returns user data and access token when credentials are valid', async () => {
      authenticationRepository.findOne.mockResolvedValue({
        email: signInDto.email,
        passwordHash: 'hashed-password',
        userId: 'user-id',
      } as AuthenticationEntity);
      hashingService.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('signed-jwt');

      await expect(service.signIn(signInDto)).resolves.toEqual({
        userId: 'user-id',
        email: signInDto.email,
        accessToken: 'signed-jwt',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: signInDto.email,
        sub: 'user-id',
      });
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

    it('returns null when email already exists', async () => {
      authenticationRepository.findOne.mockResolvedValue({
        email: signUpDto.email,
      } as AuthenticationEntity);

      await expect(service.signUp(signUpDto)).resolves.toBeNull();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates user and authentication record when email is available', async () => {
      const savedAuth = {
        id: 'auth-id',
        userId: 'user-id',
        email: signUpDto.email,
        passwordHash: 'hashed-password',
      };

      authenticationRepository.findOne.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue({
        id: 'user-id',
        name: signUpDto.name,
        phone: signUpDto.phone,
      } as never);
      authenticationRepository.save.mockResolvedValue(
        savedAuth as AuthenticationEntity,
      );

      await expect(service.signUp(signUpDto)).resolves.toEqual(savedAuth);

      expect(usersService.create).toHaveBeenCalledWith({
        name: signUpDto.name,
        phone: signUpDto.phone,
      });
      expect(authenticationRepository.save).toHaveBeenCalledWith({
        userId: 'user-id',
        email: signUpDto.email,
        passwordHash: 'hashed-password',
      });
    });
  });
});
