import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsBeforeTime } from './is-before-time.decorator';

class TimeRangeDto {
  @IsBeforeTime('endTime')
  startTime: string;

  endTime: string;
}

describe('IsBeforeTime', () => {
  it('accepts start time before end time', async () => {
    const dto = plainToInstance(TimeRangeDto, {
      startTime: '09:00',
      endTime: '10:30',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid time format', async () => {
    const dto = plainToInstance(TimeRangeDto, {
      startTime: '9:00',
      endTime: '10:00',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('startTime');
  });

  it('rejects start time equal to end time', async () => {
    const dto = plainToInstance(TimeRangeDto, {
      startTime: '10:00',
      endTime: '10:00',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('startTime');
  });

  it('rejects start time after end time', async () => {
    const dto = plainToInstance(TimeRangeDto, {
      startTime: '11:00',
      endTime: '10:00',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('startTime');
  });
});
