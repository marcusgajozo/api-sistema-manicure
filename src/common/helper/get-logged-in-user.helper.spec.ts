import { ClsServiceManager } from 'nestjs-cls';

import { UserRequest } from '@/common/types/user-request';

import { getLoggedInUserHelper } from './get-logged-in-user.helper';

describe('getLoggedInUserHelper', () => {
  it('returns undefined when no user is in CLS context', () => {
    const cls = ClsServiceManager.getClsService();
    cls.run(() => {
      expect(getLoggedInUserHelper()).toBeUndefined();
    });
  });

  it('returns the logged in user from CLS context', () => {
    const cls = ClsServiceManager.getClsService();
    const mockUser: UserRequest = {
      userId: 'user-123',
      email: 'user@example.com',
    };

    cls.run(() => {
      cls.set('user', mockUser);
      expect(getLoggedInUserHelper()).toEqual(mockUser);
    });
  });
});
