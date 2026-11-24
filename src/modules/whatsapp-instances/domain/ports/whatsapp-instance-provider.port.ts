export const WHATSAPP_INSTANCE_PROVIDER = Symbol('WHATSAPP_INSTANCE_PROVIDER');

export interface CreatedWhatsappInstance {
  remoteInstanceId: string | null;
  qrCodeBase64: string | null;
  pairingCode: string | null;
}

export interface WhatsappInstanceProviderPort {
  createInstance(instanceName: string): Promise<CreatedWhatsappInstance>;
}
