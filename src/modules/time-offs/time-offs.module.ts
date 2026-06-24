import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeOffsController } from './controllers/time-offs.controller';
import { TimeOffEntity } from './entities/time-off.entity';
import { TimeOffsService } from './services/time-offs.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeOffEntity])],
  controllers: [TimeOffsController],
  providers: [TimeOffsService],
})
export class TimeOffsModule {}
