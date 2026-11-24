import { WhatsappInstancesEntity } from '../entities/whatsapp-instances.entity';

export const WHATSAPP_INSTANCE_REPOSITORY = Symbol(
  'WHATSAPP_INSTANCE_REPOSITORY',
);

export interface WhatsappInstancesRepository {
  create(
    whatsappInstancesEntity: WhatsappInstancesEntity,
  ): Promise<WhatsappInstancesEntity>;
  findActiveByUserId(userId: string): Promise<WhatsappInstancesEntity | null>;
}
