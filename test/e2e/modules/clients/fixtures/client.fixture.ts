export interface ClientPayload {
  name: string;
  phone: string;
}

export function createClientPayload(
  overrides: Partial<ClientPayload> = {},
): ClientPayload {
  return {
    name: 'Maria Silva',
    phone: '11999998888',
    ...overrides,
  };
}
