import { StatusWhatsappInstances } from '../enums/status-whatsapp-instaces.enum';
import { WhatsappInstanceValidator } from '../validators/whatsapp-instaces.validator';

export class WhatsappInstancesEntity {
  constructor(
    public readonly id: string,
    public readonly remoteInstaceId: string | null,
    public readonly userId: string,
    public status: StatusWhatsappInstances,
    public readonly createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date,
  ) {
    WhatsappInstanceValidator.validate(this);
  }

  static create(userId: string): WhatsappInstancesEntity {
    return new WhatsappInstancesEntity(
      '',
      null,
      userId,
      StatusWhatsappInstances.DISCONNECTED,
      new Date(),
    );
  }
}
