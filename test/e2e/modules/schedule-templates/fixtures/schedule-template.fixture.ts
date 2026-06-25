export interface ScheduleTemplatePayload {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export function createScheduleTemplatePayload(
  overrides: Partial<ScheduleTemplatePayload> = {},
): ScheduleTemplatePayload {
  return {
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '12:00',
    ...overrides,
  };
}
