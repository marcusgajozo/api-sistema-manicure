import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientEntity } from '../entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async create(createClientDto: CreateClientDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { name, phone } = createClientDto;

    const client = this.clientRepository.create({
      name,
      phone,
      user: { id: currentUserId },
    });

    return await this.clientRepository.save(client);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { limit, page } = paginationQueryDto;

    const [clients, totalCount] = await this.clientRepository.findAndCount({
      where: { user: { id: currentUserId } },
      skip: page - 1,
      take: limit,
    });

    return { clients, totalCount };
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const client = await this.clientRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const client = await this.findOne(id, currentUserId);

    if (!client) {
      return client;
    }

    const { name, phone } = updateClientDto;
    const updatedAt = new Date();

    return await this.clientRepository.update(client.id, {
      name,
      phone,
      updatedAt,
    });
  }

  async remove(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const client = await this.findOne(id, currentUserId);

    if (!client) {
      return client;
    }

    return await this.clientRepository.remove(client);
  }
}
