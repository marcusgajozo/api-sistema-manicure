import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { NotifyReturnClientEnum } from '../enums/notify-client.enum';
import { StatusAppointmentEnum } from '../enums/status-appointment.enum';
import { UpdateAppointmentDto } from './update-appointment.dto';

describe('UpdateAppointmentDto', () => {
  it('accepts an empty payload', async () => {
    const dto = plainToInstance(UpdateAppointmentDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateAppointmentDto, {
      clientName: 'Ana Souza',
      statusAppointment: StatusAppointmentEnum.DONE,
      notifyReturnClient: NotifyReturnClientEnum.NOTIFIED,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid statusAppointment enum', async () => {
    const dto = plainToInstance(UpdateAppointmentDto, {
      statusAppointment: 'invalid_status',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'statusAppointment',
      'validation.INVALID_ENUM',
    );
  });

  it('rejects invalid notifyReturnClient enum', async () => {
    const dto = plainToInstance(UpdateAppointmentDto, {
      notifyReturnClient: 'invalid_notify',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'notifyReturnClient',
      'validation.INVALID_ENUM',
    );
  });

  it('inherits validation metadata from CreateAppointmentDto with whitelist', async () => {
    const dto = plainToInstance(UpdateAppointmentDto, {
      clientName: 'Ana Souza',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.clientName).toBe('Ana Souza');
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'clientName')).toBe(false);
  });
});
