export enum AppointmentEventEnum {
  CREATED = 'appointment.created',
  CANCELED = 'appointment.canceled',
  RESCHEDULED = 'appointment.rescheduled',
}

export class AppointmentCreatedEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly appointmentDate: Date,
  ) {}
}

export class AppointmentCanceledEvent {
  constructor(public readonly appointmentId: string) {}
}

export class AppointmentRescheduledEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly newAppointmentDate: Date,
  ) {}
}
