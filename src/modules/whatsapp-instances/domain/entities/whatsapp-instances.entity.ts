import { StatusWhatsappInstances } from '../enums/status-whatsapp-instaces.enum';
import { WhatsappInstanceValidator } from '../validators/whatsapp-instaces.validator';

export class WhatsappInstancesEntity {
  constructor(
    public readonly id: string,
    public readonly intance: string,
    public readonly userId: string,
    public status: StatusWhatsappInstances,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date,
  ) {
    WhatsappInstanceValidator.validate(this);
  }
}
