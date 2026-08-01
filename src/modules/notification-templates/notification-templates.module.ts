import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationTemplatesController } from './controllers/notification-templates.controller';
import { NotificationTemplateEntity } from './entities/notification-template.entity';
import { NotificationTemplatesService } from './services/notification-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationTemplateEntity])],
  controllers: [NotificationTemplatesController],
  providers: [NotificationTemplatesService],
  exports: [NotificationTemplatesService],
})
export class NotificationTemplatesModule {}
