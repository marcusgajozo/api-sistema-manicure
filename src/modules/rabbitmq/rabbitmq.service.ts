import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { ChannelModel, connect } from 'amqplib';

import { rabbitmqConfig } from './rabbitmq.config';

@Injectable()
export class RabbitmqService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  @Inject(rabbitmqConfig.KEY)
  private readonly config: ConfigType<typeof rabbitmqConfig>;
  connection: ChannelModel | null = null;

  async onApplicationBootstrap() {
    if (!this.connection) {
      this.connection = await connect(this.config.url);
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
