import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserRequest } from '../types/user-request';

export const UserAuth = createParamDecorator(
  (data: keyof UserRequest, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    return data ? user?.[data as keyof typeof user] : user;
  },
);
