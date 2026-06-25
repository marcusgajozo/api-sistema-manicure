import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';

import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientEntity } from '../entities/client.entity';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientRepository: jest.Mocked<
    Pick<
      Repository<ClientEntity>,
      'create' | 'save' | 'findAndCount' | 'findOne' | 'update' | 'remove'
    >
  >;

  const userId = 'user-id';

  beforeEach(async () => {
    clientRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(ClientEntity),
          useValue: clientRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  describe('create', () => {
    const createClientDto: CreateClientDto = {
      name: 'Maria Silva',
      phone: '11999998888',
    };

    it('creates and persists a client for the authenticated user', async () => {
      const createdClient = {
        name: createClientDto.name,
        phone: createClientDto.phone,
        user: { id: userId },
      } as ClientEntity;
      const savedClient = {
        ...createdClient,
        id: 'client-id',
      } as ClientEntity;

      clientRepository.create.mockReturnValue(createdClient);
      clientRepository.save.mockResolvedValue(savedClient);

      await expect(service.create(createClientDto, userId)).resolves.toEqual(
        savedClient,
      );

      expect(clientRepository.create).toHaveBeenCalledWith({
        name: createClientDto.name,
        phone: createClientDto.phone,
        user: { id: userId },
      });
      expect(clientRepository.save).toHaveBeenCalledWith(createdClient);
    });
  });

  describe('findAll', () => {
    it('returns paginated clients for the authenticated user', async () => {
      const clients = [{ id: 'client-id' }] as ClientEntity[];

      clientRepository.findAndCount.mockResolvedValue([clients, 1]);

      await expect(
        service.findAll({ page: 2, limit: 5 }, userId),
      ).resolves.toEqual({
        clients,
        totalCount: 1,
      });

      expect(clientRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        skip: 1,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('returns a client when it belongs to the user', async () => {
      const client = { id: 'client-id' } as ClientEntity;

      clientRepository.findOne.mockResolvedValue(client);

      await expect(service.findOne('client-id', userId)).resolves.toEqual(
        client,
      );

      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-id', user: { id: userId } },
      });
    });

    it('returns null when the client does not exist', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', userId)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    const updateClientDto: UpdateClientDto = {
      name: 'Maria Santos',
    };

    it('returns null when the client does not exist', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', updateClientDto, userId),
      ).resolves.toBeNull();
      expect(clientRepository.update).not.toHaveBeenCalled();
    });

    it('updates the client when it belongs to the user', async () => {
      const client = { id: 'client-id' } as ClientEntity;
      const updateResult = { affected: 1 } as UpdateResult;

      clientRepository.findOne.mockResolvedValue(client);
      clientRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.update('client-id', updateClientDto, userId),
      ).resolves.toEqual(updateResult);

      expect(clientRepository.update).toHaveBeenCalledWith('client-id', {
        name: 'Maria Santos',
        phone: undefined,
        updatedAt: expect.any(Date) as Date,
      });
    });
  });

  describe('remove', () => {
    it('returns null when the client does not exist', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id', userId)).resolves.toBeNull();
      expect(clientRepository.remove).not.toHaveBeenCalled();
    });

    it('removes the client when it belongs to the user', async () => {
      const client = { id: 'client-id' } as ClientEntity;

      clientRepository.findOne.mockResolvedValue(client);
      clientRepository.remove.mockResolvedValue(client);

      await expect(service.remove('client-id', userId)).resolves.toEqual(
        client,
      );
      expect(clientRepository.remove).toHaveBeenCalledWith(client);
    });
  });
});
