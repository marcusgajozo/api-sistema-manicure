import { WhatsappInstancesEntity } from '../entities/whatsapp-instances.entity';

export interface WhatsappInstancesRepository {
  create(
    whatsappInstancesEntity: WhatsappInstancesEntity,
  ): Promise<WhatsappInstancesEntity | null>;
}
