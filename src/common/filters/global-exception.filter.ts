import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  I18nContext,
  I18nService,
  I18nValidationError,
  I18nValidationException,
} from 'nestjs-i18n';

const DEFAULT_HTTP_EXCEPTIONS: Record<string, string> = {
  'Bad Request': 'exception.BAD_REQUEST',
  Unauthorized: 'exception.UNAUTHORIZED',
  'Not Found': 'exception.NOT_FOUND',
  Forbidden: 'exception.FORBIDDEN',
  'Not Acceptable': 'exception.NOT_ACCEPTABLE',
  'Request Timeout': 'exception.REQUEST_TIMEOUT',
  Conflict: 'exception.CONFLICT',
  Gone: 'exception.GONE',
  'Http Version Not Supported': 'exception.HTTP_VERSION_NOT_SUPPORTED',
  'Payload Too Large': 'exception.PAYLOAD_TOO_LARGE',
  'Unsupported Media Type': 'exception.UNSUPPORTED_MEDIA_TYPE',
  'Unprocessable Entity': 'exception.UNPROCESSABLE_ENTITY',
  'Internal Server Error': 'exception.INTERNAL_SERVER_ERROR',
  'Not Implemented': 'exception.NOT_IMPLEMENTED',
  'I Am A Teapot': 'exception.IM_A_TEAPOT',
  'Method Not Allowed': 'exception.METHOD_NOT_ALLOWED',
  'Bad Gateway': 'exception.BAD_GATEWAY',
  'Service Unavailable': 'exception.SERVICE_UNAVAILABLE',
  'Gateway Timeout': 'exception.GATEWAY_TIMEOUT',
  'Precondition Failed': 'exception.PRECONDITION_FAILED',
};

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const i18n = I18nContext.current(host);
    const lang = i18n?.lang || 'pt-BR';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponseName = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';

    if (exception instanceof I18nValidationException) {
      status = exception.getStatus();
      errorResponseName = 'Bad Request';
      message = this.formatI18nErrors(exception.errors, lang);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: unknown = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as { message?: string | string[]; error?: string };
        errorResponseName = resObj.error || 'Error';
        const rawMessage = resObj.message;

        if (typeof rawMessage === 'string') {
          const translationKey =
            DEFAULT_HTTP_EXCEPTIONS[rawMessage] || rawMessage;
          message = this.i18n.t(translationKey, {
            lang,
            defaultValue: rawMessage,
          });
        } else if (Array.isArray(rawMessage)) {
          message = rawMessage.map((msg) => {
            const translationKey = DEFAULT_HTTP_EXCEPTIONS[msg] || msg;
            return this.i18n.t(translationKey, {
              lang,
              defaultValue: msg,
            });
          });
        } else {
          message = 'An error occurred';
        }
      } else if (typeof res === 'string') {
        const translationKey = DEFAULT_HTTP_EXCEPTIONS[res] || res;
        message = this.i18n.t(translationKey, {
          lang,
          defaultValue: res,
        });
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `${request.method} ${request.url} - Error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - Unknown exception: ${JSON.stringify(exception)}`,
      );
    }

    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      !(exception instanceof Error)
    ) {
      this.logger.error(
        `${request.method} ${request.url} - Unexpected internal error: ${JSON.stringify(exception)}`,
      );
    }

    const errorTranslationKey =
      DEFAULT_HTTP_EXCEPTIONS[errorResponseName] || errorResponseName;
    const translatedErrorName = this.i18n.t(errorTranslationKey, {
      lang,
      defaultValue: errorResponseName,
    });

    response.status(status).json({
      statusCode: status,
      message,
      error: translatedErrorName,
    });
  }

  private formatI18nErrors(
    errors: I18nValidationError[],
    lang: string,
  ): string[] {
    const messages: string[] = [];

    for (const errItem of errors) {
      const property = errItem.property;
      if (errItem.constraints) {
        for (const value of Object.values(errItem.constraints)) {
          if (typeof value === 'string' && value.includes('|')) {
            const [translationKey, argsString] = value.split('|');
            let args: Record<string, unknown> = {};

            if (argsString) {
              try {
                args = JSON.parse(argsString) as Record<string, unknown>;
              } catch {
                args = {};
              }
            }

            args.property = property;

            messages.push(
              this.i18n.t(translationKey, {
                args,
                lang,
              }),
            );
          } else if (typeof value === 'string') {
            messages.push(
              this.i18n.t(value, {
                args: { property },
                lang,
              }),
            );
          } else {
            messages.push(String(value));
          }
        }
      }
      if (errItem.children && errItem.children.length > 0) {
        messages.push(...this.formatI18nErrors(errItem.children, lang));
      }
    }

    return messages;
  }
}
