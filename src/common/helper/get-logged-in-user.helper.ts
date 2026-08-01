import { ClsServiceManager } from 'nestjs-cls';

import { UserRequest } from '@/common/types/user-request';

export type JwtPayloadDto = UserRequest;

export function getLoggedInUserHelper(): UserRequest | undefined {
  const cls = ClsServiceManager.getClsService();
  return cls.get<UserRequest>('user');
}

export const getUsuarioLogado = getLoggedInUserHelper;
