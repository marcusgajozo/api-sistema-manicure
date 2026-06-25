export interface AppointmentPayload {
  procedureId?: string;
  procedureName?: string;
  procedurePrice?: number;
  procedureFollowUpDays?: number;
  clientId?: string;
  clientName?: string;
  phoneClient?: string;
  startDate: string;
  endDate: string;
}

export function createAppointmentPayload(
  overrides: Partial<AppointmentPayload> = {},
): AppointmentPayload {
  return {
    procedureName: 'Manicure',
    procedurePrice: 5000,
    clientName: 'Maria Silva',
    phoneClient: '11999998888',
    startDate: '2026-07-10T09:00:00.000Z',
    endDate: '2026-07-10T10:00:00.000Z',
    ...overrides,
  };
}
