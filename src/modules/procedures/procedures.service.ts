import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { ProcedureEntity } from './entities/procedure.entity';

@Injectable()
export class ProceduresService {
  constructor(
    @InjectRepository(ProcedureEntity)
    private readonly procedureRepository: Repository<ProcedureEntity>,
  ) {}

  async create(createProcedureDto: CreateProcedureDto, userId: string) {
    const { name, description, price, returnDays, durationMinutes } =
      createProcedureDto;

    const procedure = this.procedureRepository.create({
      name,
      description,
      price,
      returnDays,
      durationMinutes,
      user: { id: userId },
    });

    return await this.procedureRepository.save(procedure);
  }

  async findAll(paginationQueryDto: PaginationQueryDto, userId: string) {
    const { page, limit } = paginationQueryDto;

    const [procedures, totalCount] =
      await this.procedureRepository.findAndCount({
        skip: page - 1,
        take: limit,
        where: { user: { id: userId } },
      });

    return { procedures, totalCount };
  }

  async findOne(id: string, userId: string) {
    return await this.procedureRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async update(
    id: string,
    updateProcedureDto: UpdateProcedureDto,
    userId: string,
  ) {
    const procedure = await this.findOne(id, userId);

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

  async remove(id: string, userId: string) {
    const procedure = await this.findOne(id, userId);

    if (!procedure) {
      return procedure;
    }

    return this.procedureRepository.delete(procedure.id);
  }
}
