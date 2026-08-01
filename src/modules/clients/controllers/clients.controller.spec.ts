import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';

import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientEntity } from '../entities/client.entity';
import { ClientsService } from '../services/clients.service';
import { ClientsController } from './clients.controller';

describe('ClientsController', () => {
  let controller: ClientsController;
  let clientsService: jest.Mocked<
    Pick<ClientsService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    clientsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: clientsService,
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  describe('create', () => {
    const createClientDto: CreateClientDto = {
      name: 'Maria Silva',
      phone: '11999998888',
    };

    it('creates a client for the authenticated user', async () => {
      clientsService.create.mockResolvedValue({
        id: 'client-id',
      } as ClientEntity);

      await expect(controller.create(createClientDto)).resolves.toBeUndefined();
      expect(clientsService.create).toHaveBeenCalledWith(createClientDto);
    });
  });

  describe('findAll', () => {
    it('returns paginated clients', async () => {
      const clients = [{ id: 'client-id' }] as ClientEntity[];

      clientsService.findAll.mockResolvedValue({
        clients,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(
        new PaginatedResponseDto(clients, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(clientsService.findAll).toHaveBeenCalledWith({
        limit: 10,
        page: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns a client when it exists', async () => {
      const client = { id: 'client-id' } as ClientEntity;

      clientsService.findOne.mockResolvedValue(client);

      const result = await controller.findOne('client-id');

      expect(result).toEqual(new ResponseDto(client));
    });

    it('throws NotFoundException when the client does not exist', async () => {
      clientsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateClientDto: UpdateClientDto = {
      phone: '11988887777',
    };

    it('updates a client when it exists', async () => {
      clientsService.update.mockResolvedValue({ affected: 1 } as never);

      await expect(
        controller.update('client-id', updateClientDto),
      ).resolves.toBeUndefined();
      expect(clientsService.update).toHaveBeenCalledWith(
        'client-id',
        updateClientDto,
      );
    });

    it('throws NotFoundException when the client does not exist', async () => {
      clientsService.update.mockResolvedValue(null);

      await expect(
        controller.update('missing-id', updateClientDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes a client when it exists', async () => {
      clientsService.remove.mockResolvedValue({
        id: 'client-id',
      } as ClientEntity);

      await expect(controller.remove('client-id')).resolves.toBeUndefined();
      expect(clientsService.remove).toHaveBeenCalledWith('client-id');
    });

    it('throws NotFoundException when the client does not exist', async () => {
      clientsService.remove.mockResolvedValue(null);

      await expect(controller.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
