export interface ProcedurePayload {
  name: string;
  description?: string;
  price: number;
  returnDays: number;
  durationMinutes?: number;
}

export function createProcedurePayload(
  overrides: Partial<ProcedurePayload> = {},
): ProcedurePayload {
  return {
    name: 'Manicure',
    description: 'Manicure completa',
    price: 5000,
    returnDays: 15,
    durationMinutes: 60,
    ...overrides,
  };
}
