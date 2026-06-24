import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimeOffEntity } from './entities/time-off.entity';
import { TimeOffsController } from './time-offs.controller';
import { TimeOffsService } from './time-offs.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeOffEntity])],
  controllers: [TimeOffsController],
  providers: [TimeOffsService],
})
export class TimeOffsModule {}
