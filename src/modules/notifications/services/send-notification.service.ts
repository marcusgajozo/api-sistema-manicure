import { Injectable, OnModuleInit } from '@nestjs/common';

import { RabbitmqService } from '@/modules/rabbitmq/rabbitmq.service';

@Injectable()
export class SendNotificationService implements OnModuleInit {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  onModuleInit() {
    const connection = this.rabbitmqService.connection;
    if (connection) {
      console.log('RabbitMQ connection established:', connection);
    }
  }
}
