import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';

import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';
import { ProcedureEntity } from '../entities/procedure.entity';
import { ProceduresService } from '../services/procedures.service';

@ApiBearerAuth()
@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  async create(@Body() createProcedureDto: CreateProcedureDto) {
    await this.proceduresService.create(createProcedureDto);
  }

  @Get()
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    const { procedures, totalCount } =
      await this.proceduresService.findAll(paginationQueryDto);

    const { limit = 10, page = 1 } = paginationQueryDto;

    return new PaginatedResponseDto<ProcedureEntity>(procedures, {
      page,
      limit,
      totalCount,
    });
  }

  @Get(':id')
  async findOne(@Param('id', VerifyUUIDIdPipe) id: string) {
    const procedure = await this.proceduresService.findOne(id);

    if (!procedure) {
      throw new NotFoundException();
    }

    return new ResponseDto(procedure);
  }

  @Patch(':id')
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateProcedureDto: UpdateProcedureDto,
  ) {
    const procedure = await this.proceduresService.update(
      id,
      updateProcedureDto,
    );

    if (!procedure) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  async remove(@Param('id', VerifyUUIDIdPipe) id: string) {
    const procedure = await this.proceduresService.remove(id);

    if (!procedure) {
      throw new NotFoundException();
    }
  }
}
