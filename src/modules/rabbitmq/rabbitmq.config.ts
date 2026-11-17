import { ConfigFactory, registerAs } from '@nestjs/config';

type RabbitmqConfigFactory = {
  url: string;
};

const rabbitmqConfigFactory: ConfigFactory<RabbitmqConfigFactory> = () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq-manicure:5672',
});

export const rabbitmqConfig = registerAs('rabbitmq', rabbitmqConfigFactory);
