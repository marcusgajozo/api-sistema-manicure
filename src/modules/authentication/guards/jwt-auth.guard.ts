import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ClsServiceManager } from 'nestjs-cls';
import { I18nService } from 'nestjs-i18n';

import { IS_PUBLIC_KEY } from '@/common/decorator/public.decorator';
import { UserRequest } from '@/common/types/user-request';
import { I18nTranslations } from '@/generated/i18n.generated';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly i18n?: I18nService<I18nTranslations>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;
    return result;
  }

  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException(
        this.i18n?.translate('validation.UNAUTHORIZED'),
      );
    }

    const clsStore = ClsServiceManager.getClsService();
    if (clsStore.isActive()) {
      clsStore.set('user', user as UserRequest);
    }

    return user as TUser;
  }
}
