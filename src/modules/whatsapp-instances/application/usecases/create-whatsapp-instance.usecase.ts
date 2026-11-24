import { WhatsappInstancesEntity } from '../../domain/entities/whatsapp-instances.entity';
import { WhatsappInstanceProviderPort } from '../../domain/ports/whatsapp-instance-provider.port';
import { WhatsappInstancesRepository } from '../../domain/repositories/whatsapp-instances.repository';

interface CreateWhatsappInstaceUseCaseOutput {
  instace: WhatsappInstancesEntity;
  qrCodeBase64: string | null;
  pairingCode: string | null;
}

export class CreateWhatsappInstaceUseCase {
  constructor(
    private readonly repository: WhatsappInstancesRepository,
    private readonly provider: WhatsappInstanceProviderPort,
  ) {}

  async execute(userId: string): Promise<CreateWhatsappInstaceUseCaseOutput> {
    const existing = await this.repository.findActiveByUserId(userId);

    if (existing) {
      throw new Error();
    }

    const instace = await this.repository.create(
      WhatsappInstancesEntity.create(userId),
    );

    const created = await this.provider.createInstance(userId);

    return {
      instace,
      qrCodeBase64: created.qrCodeBase64,
      pairingCode: created.pairingCode,
    };
  }
}
