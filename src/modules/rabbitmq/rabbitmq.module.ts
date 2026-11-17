import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { rabbitmqConfig } from './rabbitmq.config';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [ConfigModule.forFeature(rabbitmqConfig)],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
