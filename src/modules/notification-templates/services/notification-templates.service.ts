import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getLoggedInUserHelper } from '@/common/helper/get-logged-in-user.helper';
import { NotificationTypeEnum } from '@/modules/notifications/enums/notification-type.enum';

import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../dto/update-notification-template.dto';
import { NotificationTemplateEntity } from '../entities/notification-template.entity';

@Injectable()
export class NotificationTemplatesService {
  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly templateRepository: Repository<NotificationTemplateEntity>,
  ) {}

  private getUserId(explicitUserId?: string): string {
    const user = getLoggedInUserHelper();
    return explicitUserId ?? user?.userId ?? '';
  }

  async create(createDto: CreateNotificationTemplateDto, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const template = this.templateRepository.create({
      ...createDto,
      user: { id: currentUserId },
    });
    return this.templateRepository.save(template);
  }

  async findAll(userId?: string) {
    const currentUserId = this.getUserId(userId);
    return this.templateRepository.find({
      where: { user: { id: currentUserId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string) {
    const currentUserId = this.getUserId(userId);
    const template = await this.templateRepository.findOne({
      where: { id, user: { id: currentUserId } },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async findByType(userId: string, type: NotificationTypeEnum) {
    return this.templateRepository.findOne({
      where: { user: { id: userId }, type },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateNotificationTemplateDto,
    userId?: string,
  ) {
    const template = await this.findOne(id, userId);

    this.templateRepository.merge(template, updateDto);
    return this.templateRepository.save(template);
  }

  async remove(id: string, userId?: string) {
    const template = await this.findOne(id, userId);
    return this.templateRepository.remove(template);
  }

  /**
   * Compila o template substituindo os placeholders pelos dados.
   * Ex: "Olá {{clientName}}" -> "Olá Nicole Nicolin"
   */
  compileTemplate(
    templateContent: string,
    data: Record<string, string>,
  ): string {
    return templateContent.replace(/{{(\w+)}}/g, (match, key: string) => {
      const value = data[key];
      return value !== undefined ? value : match;
    });
  }
}
