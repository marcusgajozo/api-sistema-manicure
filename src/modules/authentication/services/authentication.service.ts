import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from '@/modules/users/dtos/create-user.dto';
import { UsersService } from '@/modules/users/users.service';

import { SignInDto } from '../dtos/sign-in.dto';
import { SignUpDto } from '../dtos/sign-up.dto';
import { AuthenticationEntity } from '../entities/authentication.entity';
import { HashingService } from './hashing.service';

export interface SignInResult {
  userId: string;
  email: string;
  accessToken: string;
}

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(AuthenticationEntity)
    private readonly authenticationRepository: Repository<AuthenticationEntity>,
    private readonly userService: UsersService,
    private readonly bcryptService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<SignInResult | null> {
    const { email, password } = signInDto;

    const auth = await this.authenticationRepository.findOne({
      where: { email },
    });

    if (!auth) {
      return null;
    }

    const isPasswordValid = await this.bcryptService.compare(
      password,
      auth.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    const payload = { email: auth.email, sub: auth.userId };

    return {
      userId: auth.userId,
      email: auth.email,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const partialSignUpDto = {
      email: signUpDto.email,
      passwordHash: await this.bcryptService.hash(signUpDto.password),
    };

    const partialUser: CreateUserDto = {
      name: signUpDto.name,
      phone: signUpDto.phone,
    };

    const hasEmailRecord = await this.authenticationRepository.findOne({
      where: { email: signUpDto.email },
    });

    if (hasEmailRecord) {
      return null;
    }

    const createUser = await this.userService.create(partialUser);

    return await this.authenticationRepository.save({
      userId: createUser.id,
      ...partialSignUpDto,
    });
  }
}
