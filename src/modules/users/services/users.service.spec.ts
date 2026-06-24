import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<
    Pick<Repository<UserEntity>, 'create' | 'save'>
  >;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Jane Doe',
      phone: '11999999999',
    };

    it('creates and persists a user with name and phone from dto', async () => {
      const createdUser = {
        name: createUserDto.name,
        phone: createUserDto.phone,
      } as UserEntity;
      const savedUser = {
        id: 'user-id',
        name: createUserDto.name,
        phone: createUserDto.phone,
      } as UserEntity;

      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(savedUser);

      await expect(service.create(createUserDto)).resolves.toEqual(savedUser);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        phone: createUserDto.phone,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });
});
