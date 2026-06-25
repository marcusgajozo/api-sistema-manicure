import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateAppointmentDto } from './create-appointment.dto';

function createValidCreateAppointmentDto(
  overrides: Partial<CreateAppointmentDto> = {},
): CreateAppointmentDto {
  return plainToInstance(CreateAppointmentDto, {
    procedureName: 'Manicure',
    procedurePrice: 5000,
    clientName: 'Maria Silva',
    phoneClient: '11999998888',
    startDate: '2026-07-01T09:00:00.000Z',
    endDate: '2026-07-01T10:00:00.000Z',
    ...overrides,
  });
}

describe('CreateAppointmentDto', () => {
  it('accepts a valid payload with inline client and procedure data', async () => {
    const dto = createValidCreateAppointmentDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts a valid payload with clientId and procedureId', async () => {
    const dto = createValidCreateAppointmentDto({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      procedureId: '660e8400-e29b-41d4-a716-446655440001',
      clientName: undefined,
      phoneClient: undefined,
      procedureName: undefined,
      procedurePrice: undefined,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when startDate is empty', async () => {
    const dto = createValidCreateAppointmentDto({ startDate: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'startDate', 'validation.NOT_EMPTY');
  });

  it('rejects when endDate is empty', async () => {
    const dto = createValidCreateAppointmentDto({ endDate: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'endDate', 'validation.NOT_EMPTY');
  });

  it('rejects when startDate is after endDate', async () => {
    const dto = createValidCreateAppointmentDto({
      startDate: '2026-07-01T11:00:00.000Z',
      endDate: '2026-07-01T10:00:00.000Z',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'startDate',
      'validation.IVALID_BEFORE_DATE',
    );
  });

  it('requires procedureName when procedureId is missing', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      procedurePrice: 5000,
      clientName: 'Maria Silva',
      phoneClient: '11999998888',
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-01T10:00:00.000Z',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'procedureName', 'validation.NOT_EMPTY');
  });

  it('requires clientName when clientId is missing', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      procedureName: 'Manicure',
      procedurePrice: 5000,
      phoneClient: '11999998888',
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-01T10:00:00.000Z',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'clientName', 'validation.NOT_EMPTY');
  });

  it('rejects invalid procedureId uuid', async () => {
    const dto = createValidCreateAppointmentDto({
      procedureId: 'invalid-uuid',
      procedureName: undefined,
      procedurePrice: undefined,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'procedureId', 'validation.INVALID_UUID');
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      procedureName: 'Manicure',
      procedurePrice: 5000,
      clientName: 'Maria Silva',
      phoneClient: '11999998888',
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-01T10:00:00.000Z',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'clientName')).toBe(false);
  });
});
