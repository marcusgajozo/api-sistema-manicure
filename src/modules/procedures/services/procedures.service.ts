import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';

import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';
import { ProcedureEntity } from '../entities/procedure.entity';

@Injectable()
export class ProceduresService {
  constructor(
    @InjectRepository(ProcedureEntity)
    private readonly procedureRepository: Repository<ProcedureEntity>,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async create(createProcedureDto: CreateProcedureDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { name, description, price, returnDays, durationMinutes } =
      createProcedureDto;

    const procedure = this.procedureRepository.create({
      name,
      description,
      price,
      returnDays,
      durationMinutes,
      user: { id: currentUserId },
    });

    return await this.procedureRepository.save(procedure);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const { page, limit } = paginationQueryDto;

    const [procedures, totalCount] =
      await this.procedureRepository.findAndCount({
        skip: page - 1,
        take: limit,
        where: { user: { id: currentUserId } },
      });

    return { procedures, totalCount };
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    return await this.procedureRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });
  }

  async update(
    id: string,
    updateProcedureDto: UpdateProcedureDto,
    userId?: string,
  ) {
    const currentUserId = this.getUserId(userId);
    const procedure = await this.findOne(id, currentUserId);

    if (!procedure) {
      return procedure;
    }

    const { name, description, durationMinutes, price, returnDays } =
      updateProcedureDto;

    const updatedAt = new Date();

    return await this.procedureRepository.update(procedure.id, {
      name,
      description,
      durationMinutes,
      price,
      returnDays,
      updatedAt,
    });
  }

  async remove(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const procedure = await this.findOne(id, currentUserId);

    if (!procedure) {
      return procedure;
    }

    return this.procedureRepository.delete(procedure.id);
  }
}
