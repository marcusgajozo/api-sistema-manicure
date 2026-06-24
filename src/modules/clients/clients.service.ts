import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientEntity } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  async create(createClientDto: CreateClientDto, userId: string) {
    const { name, phone } = createClientDto;

    const client = this.clientRepository.create({
      name,
      phone,
      user: { id: userId },
    });

    return await this.clientRepository.save(client);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId: string) {
    const { limit, page } = paginationQueryDto;

    const [clients, totalCount] = await this.clientRepository.findAndCount({
      where: { user: { id: userId } },
      skip: page - 1,
      take: limit,
    });

    return { clients, totalCount };
  }

  async findOne(id: string, userId: string) {
    const client = await this.clientRepository.findOne({
      where: { id, user: { id: userId } },
    });

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId: string) {
    const client = await this.findOne(id, userId);

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

  async remove(id: string, userId: string) {
    const client = await this.findOne(id, userId);

    if (!client) {
      return client;
    }

    return await this.clientRepository.remove(client);
  }
}
