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

  private connection: ChannelModel | null = null;
  private connectionPromise: Promise<ChannelModel> | null = null;

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async onApplicationBootstrap() {
    await this.getConnection();
  }

  async getConnection(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = connect(this.config.url)
        .then((connection) => {
          this.connection = connection;
          return connection;
        })
        .catch((error) => {
          this.connectionPromise = null;
          throw error;
        });
    }

    return this.connectionPromise;
  }
}
