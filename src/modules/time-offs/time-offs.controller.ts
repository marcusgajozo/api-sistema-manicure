import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAuth } from '@/common/decorator/user-auth.decorator';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@/common/dtos/pagination.dto';
import { VerifyUUIDIdPipe } from '@/common/pipes/verify-uuid-id.pipe';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { UpdateTimeOffDto } from './dto/update-time-off.dto';
import { ResponseDto } from '@/common/dtos/response.dto';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { TimeOffsService } from './time-offs.service';

@ApiBearerAuth()
@Controller('time-offs')
export class TimeOffsController {
  constructor(
    private readonly timeOffsService: TimeOffsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTimeOffDto: CreateTimeOffDto,
    @UserAuth('userId') userId: string,
  ) {
    await this.timeOffsService.create(createTimeOffDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @UserAuth('userId') userId: string,
  ) {
    const { limit, page } = paginationQueryDto;

    const { timeOffs, totalCount } = await this.timeOffsService.findAll(
      { limit, page },
      userId,
    );

    return new PaginatedResponseDto(timeOffs, { page, limit, totalCount });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @UserAuth('userId') userId: string,
  ) {
    const timeOff = await this.timeOffsService.findOne(id, userId);

    if (!timeOff) {
      throw new NotFoundException(this.i18n.translate('validation.NOT_FOUND'));
    }
    return new ResponseDto(timeOff);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @Body() updateTimeOffDto: UpdateTimeOffDto,
    @UserAuth('userId') userId: string,
  ) {
    const timeOff = await this.timeOffsService.update(
      id,
      updateTimeOffDto,
      userId,
    );

    if (!timeOff) {
      throw new NotFoundException(this.i18n.translate('validation.NOT_FOUND'));
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', VerifyUUIDIdPipe) id: string,
    @UserAuth('userId') userId: string,
  ) {
    const timeOff = await this.timeOffsService.remove(id, userId);

    if (!timeOff) {
      throw new NotFoundException(this.i18n.translate('validation.NOT_FOUND'));
    }
  }
}
