import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public', () => {
  it('sets isPublic metadata to true', () => {
    @Public()
    class TestController {}

    const reflector = new Reflector();
    const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, TestController);

    expect(isPublic).toBe(true);
  });
});
