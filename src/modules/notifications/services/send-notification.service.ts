import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ChannelModel } from 'amqplib';

import { RabbitmqService } from '@/modules/rabbitmq/rabbitmq.service';

const EXCHANGE_NAME = 'ex.send.notification';
const NAME_QUEUE = 'send.notification';
const ROUTING_KEY = 'send.notification';
const RETRY_EXCHANGE_NAME = 'ex.retry';
const TYPE_EXCHANGE = 'direct';
const QUEUE_PARKING = 'send.notification.parking';
const RETRY_QUEUES = [
  { nameQueue: 'send.notification.retry.1', routingKey: 'retry.1', ttl: 10000 },
  { nameQueue: 'send.notification.retry.2', routingKey: 'retry.2', ttl: 30000 },
  { nameQueue: 'send.notification.retry.3', routingKey: 'retry.3', ttl: 60000 },
];

@Injectable()
export class SendNotificationService implements OnModuleInit, OnModuleDestroy {
  private connection: ChannelModel | null = null;

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async onModuleInit() {
    this.connection = await this.rabbitmqService.getConnection();
    await this.buildTopology(this.connection);
    await this.consumeMessages(this.connection);
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async buildTopology(connection: ChannelModel): Promise<void> {
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, TYPE_EXCHANGE, {
      durable: true,
    });

    await channel.assertExchange(RETRY_EXCHANGE_NAME, TYPE_EXCHANGE, {
      durable: true,
    });

    for (const retryQueue of RETRY_QUEUES) {
      await channel.assertQueue(retryQueue.nameQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': retryQueue.ttl,
          'x-dead-letter-exchange': EXCHANGE_NAME,
          'x-dead-letter-routing-key': 'send.notification',
        },
      });

      await channel.bindQueue(
        retryQueue.nameQueue,
        RETRY_EXCHANGE_NAME,
        retryQueue.routingKey,
      );
    }

    await channel.assertQueue(QUEUE_PARKING, {
      durable: true,
    });

    await channel.bindQueue(QUEUE_PARKING, RETRY_EXCHANGE_NAME, 'parking');

    await channel.assertQueue('send.notification', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RETRY_EXCHANGE_NAME,
        'x-dead-letter-routing-key': 'retry.1',
      },
    });

    await channel.bindQueue(NAME_QUEUE, EXCHANGE_NAME, ROUTING_KEY);
  }

  private async consumeMessages(connection: ChannelModel): Promise<void> {
    const channel = await connection.createChannel();
    await channel.prefetch(1);

    await channel.consume(NAME_QUEUE, (message) =>
      console.log('Received message:', message?.content.toString()),
    );
  }
}
