import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScheduleTemplatesController } from './controllers/schedule-templates.controller';
import { ScheduleTemplateEntity } from './entities/schedule-template.entity';
import { ScheduleTemplatesService } from './services/schedule-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleTemplateEntity])],
  controllers: [ScheduleTemplatesController],
  providers: [ScheduleTemplatesService],
})
export class ScheduleTemplatesModule {}
