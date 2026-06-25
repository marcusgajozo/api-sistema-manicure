import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { DayOfWeek } from '@/common/enums/day-of-week.enum';

import { CreateScheduleTemplateDto } from './create-schedule-template.dto';

function createValidCreateScheduleTemplateDto(
  overrides: Partial<CreateScheduleTemplateDto> = {},
): CreateScheduleTemplateDto {
  return plainToInstance(CreateScheduleTemplateDto, {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '09:00',
    endTime: '12:00',
    ...overrides,
  });
}

describe('CreateScheduleTemplateDto', () => {
  it('accepts a valid payload', async () => {
    const dto = createValidCreateScheduleTemplateDto();

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects when dayOfWeek is empty', async () => {
    const dto = createValidCreateScheduleTemplateDto({
      dayOfWeek: '' as unknown as DayOfWeek,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'dayOfWeek', 'validation.NOT_EMPTY');
  });

  it('rejects invalid dayOfWeek enum', async () => {
    const dto = createValidCreateScheduleTemplateDto({
      dayOfWeek: 'invalid-day' as DayOfWeek,
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'dayOfWeek', 'validation.INVALID_ENUM');
  });

  it('rejects when startTime is empty', async () => {
    const dto = createValidCreateScheduleTemplateDto({ startTime: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'startTime', 'validation.NOT_EMPTY');
  });

  it('rejects when endTime is empty', async () => {
    const dto = createValidCreateScheduleTemplateDto({ endTime: '' });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'endTime', 'validation.NOT_EMPTY');
  });

  it('rejects invalid military time format', async () => {
    const dto = createValidCreateScheduleTemplateDto({ startTime: '9:00' });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'startTime',
      'validation.INVALID_DATE_STRING',
    );
  });

  it('rejects when startTime is not before endTime', async () => {
    const dto = createValidCreateScheduleTemplateDto({
      startTime: '14:00',
      endTime: '12:00',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'startTime',
      'validation.START_BEFORE_END_TIME',
    );
  });

  it('rejects unknown fields with whitelist enabled', async () => {
    const dto = plainToInstance(CreateScheduleTemplateDto, {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '12:00',
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'dayOfWeek')).toBe(false);
  });
});
