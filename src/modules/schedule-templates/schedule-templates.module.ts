import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScheduleTemplateEntity } from './entities/schedule-template.entity';
import { ScheduleTemplatesController } from './schedule-templates.controller';
import { ScheduleTemplatesService } from './schedule-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleTemplateEntity])],
  controllers: [ScheduleTemplatesController],
  providers: [ScheduleTemplatesService],
})
export class ScheduleTemplatesModule {}
