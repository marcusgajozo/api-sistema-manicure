export interface TimeOffPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export function createTimeOffPayload(
  overrides: Partial<TimeOffPayload> = {},
): TimeOffPayload {
  return {
    startDate: '2026-07-01T09:00:00',
    endDate: '2026-07-05T18:00:00',
    reason: 'Férias',
    ...overrides,
  };
}
