import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { I18nService, I18nValidationException } from 'nestjs-i18n';

import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let i18n: jest.Mocked<Pick<I18nService, 't'>>;
  let response: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    i18n = {
      t: jest.fn((key: string) => `translated:${key}`),
    } as unknown as jest.Mocked<Pick<I18nService, 't'>>;
    filter = new GlobalExceptionFilter(i18n as unknown as I18nService);
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'GET', url: '/test' }),
      }),
    } as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats HttpException responses', () => {
    const exception = new BadRequestException({
      message: 'Invalid payload',
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid payload',
      error: 'Bad Request',
    });
  });

  it('formats I18nValidationException responses', () => {
    const exception = new I18nValidationException([
      {
        property: 'email',
        constraints: {
          isEmail: 'validation.INVALID_EMAIL',
        },
        children: [],
      },
    ]);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['translated:validation.INVALID_EMAIL'],
      error: 'Bad Request',
    });
    expect(i18n.t).toHaveBeenCalledWith('validation.INVALID_EMAIL', {
      args: { property: 'email' },
      lang: 'pt-BR',
    });
  });

  it('formats generic Error responses', () => {
    const exception = new Error('Unexpected failure');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unexpected failure',
      error: 'Internal Server Error',
    });
  });

  it('formats unknown exceptions as internal server error', () => {
    filter.catch({ code: 'UNKNOWN' }, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    });
  });
});
