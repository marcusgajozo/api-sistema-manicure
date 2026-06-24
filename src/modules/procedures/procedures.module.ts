import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProcedureEntity } from './entities/procedure.entity';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProcedureEntity])],
  controllers: [ProceduresController],
  providers: [ProceduresService],
})
export class ProceduresModule {}
