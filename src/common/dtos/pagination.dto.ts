import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Current page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @IsDate()
  endDate?: Date;
}

export class PaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  totalPages: number;
}

interface Meta {
  page: number;
  limit: number;
  totalCount: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  meta: PaginationMetaDto;

  constructor(data: T[], meta: Meta) {
    this.data = data;

    const { page, limit, totalCount } = meta;

    this.meta = {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
