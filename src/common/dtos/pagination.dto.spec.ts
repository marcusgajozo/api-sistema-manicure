import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { PaginatedResponseDto, PaginationQueryDto } from './pagination.dto';

describe('PaginationQueryDto', () => {
  it('uses default pagination values', async () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('transforms and validates query params', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '25',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(25);
  });

  it('rejects invalid pagination values', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 0,
      limit: -1,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PaginatedResponseDto', () => {
  it('calculates total pages from pagination meta', () => {
    const response = new PaginatedResponseDto(['item-1', 'item-2'], {
      page: 1,
      limit: 2,
      totalCount: 5,
    });

    expect(response.data).toEqual(['item-1', 'item-2']);
    expect(response.meta).toEqual({
      page: 1,
      limit: 2,
      totalCount: 5,
      totalPages: 3,
    });
  });
});
