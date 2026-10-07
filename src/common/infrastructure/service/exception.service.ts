import {
  BadGatewayException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { IExceptionService } from '@/common/domain/service/exception.service';

export class ExceptionService implements IExceptionService {
  badRequest(message: string): never {
    throw new BadGatewayException(message);
  }

  conflict(message: string): never {
    throw new ConflictException(message);
  }

  notFound(message: string): never {
    throw new NotFoundException(message);
  }

  internal(message: string): never {
    throw new InternalServerErrorException(message);
  }
}
