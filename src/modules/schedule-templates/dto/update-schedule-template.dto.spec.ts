import { expectValidationI18nKey } from '@test/helpers/i18n-validation.helper';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { DayOfWeek } from '@/common/enums/day-of-week.enum';

import { UpdateScheduleTemplateDto } from './update-schedule-template.dto';

describe('UpdateScheduleTemplateDto', () => {
  it('accepts an empty payload', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
      dayOfWeek: DayOfWeek.TUESDAY,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts partial updates when both times are provided', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
      startTime: '10:00',
      endTime: '13:00',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects partial startTime without endTime', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
      startTime: '10:00',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(
      errors,
      'startTime',
      'validation.START_BEFORE_END_TIME',
    );
  });

  it('rejects empty startTime when provided', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
      startTime: '',
    });

    const errors = await validate(dto);
    expectValidationI18nKey(errors, 'startTime', 'validation.NOT_EMPTY');
  });

  it('rejects when startTime is not before endTime', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
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

  it('inherits validation metadata from CreateScheduleTemplateDto with whitelist', async () => {
    const dto = plainToInstance(UpdateScheduleTemplateDto, {
      dayOfWeek: DayOfWeek.TUESDAY,
      extraField: 'not allowed',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(dto.dayOfWeek).toBe(DayOfWeek.TUESDAY);
    expect(errors.some((error) => error.property === 'extraField')).toBe(true);
    expect(errors.some((error) => error.property === 'dayOfWeek')).toBe(false);
  });
});
