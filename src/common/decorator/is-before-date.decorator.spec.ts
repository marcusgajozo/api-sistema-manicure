import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsBeforeDate } from './is-before-date.decorator';

class DateRangeDto {
  @IsBeforeDate('endDate')
  startDate: string;

  endDate: string;
}

describe('IsBeforeDate', () => {
  it('accepts start date before end date', async () => {
    const dto = plainToInstance(DateRangeDto, {
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T12:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects start date equal to end date', async () => {
    const dto = plainToInstance(DateRangeDto, {
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T10:00:00.000Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('startDate');
  });

  it('rejects start date after end date', async () => {
    const dto = plainToInstance(DateRangeDto, {
      startDate: '2026-01-01T14:00:00.000Z',
      endDate: '2026-01-01T12:00:00.000Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('startDate');
  });
});
