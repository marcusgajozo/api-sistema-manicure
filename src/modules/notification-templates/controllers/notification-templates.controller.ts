import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';

import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../dto/update-notification-template.dto';
import { NotificationTemplatesService } from '../services/notification-templates.service';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(
    private readonly notificationTemplatesService: NotificationTemplatesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateNotificationTemplateDto) {
    return this.notificationTemplatesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.notificationTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', VerifyUUIDIdPipe) id: string) {
    return this.notificationTemplatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateDto: UpdateNotificationTemplateDto,
  ) {
    return this.notificationTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', VerifyUUIDIdPipe) id: string) {
    return this.notificationTemplatesService.remove(id);
  }
}
