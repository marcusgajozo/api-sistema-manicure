import { Test, TestingModule } from '@nestjs/testing';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';

import { NotificationEntity } from '../entities/notification.entity';
import { NotificationsService } from '../services/notifications.service';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: jest.Mocked<Pick<NotificationsService, 'findAll'>>;

  beforeEach(async () => {
    notificationsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('findAll', () => {
    it('should return a paginated response of notifications', async () => {
      const paginationQueryDto = {
        page: 1,
        limit: 10,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-31'),
      };
      const mockNotifications = [
        { id: '1' },
      ] as unknown as NotificationEntity[];

      notificationsService.findAll.mockResolvedValue({
        notifications: mockNotifications,
        totalCount: 1,
      });

      const result = await controller.findAll(paginationQueryDto);

      expect(notificationsService.findAll).toHaveBeenCalledWith(
        paginationQueryDto,
      );
      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data).toEqual(mockNotifications);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });
  });
});
