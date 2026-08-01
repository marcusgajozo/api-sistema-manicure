import { Test, TestingModule } from '@nestjs/testing';

import { NotificationTemplatesService } from '../services/notification-templates.service';
import { NotificationTemplatesController } from './notification-templates.controller';

describe('NotificationTemplatesController', () => {
  let controller: NotificationTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationTemplatesController],
      providers: [
        {
          provide: NotificationTemplatesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByType: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            compileTemplate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationTemplatesController>(
      NotificationTemplatesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
