import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProceduresController } from './controllers/procedures.controller';
import { ProcedureEntity } from './entities/procedure.entity';
import { ProceduresService } from './services/procedures.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProcedureEntity])],
  controllers: [ProceduresController],
  providers: [ProceduresService],
})
export class ProceduresModule {}
