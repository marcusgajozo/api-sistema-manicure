import { I18nValidationException } from 'nestjs-i18n';
import { VerifyUUIDIdPipe } from './verify-uuid-id.pipe';

describe('VerifyUUIDIdPipe', () => {
  const pipe = new VerifyUUIDIdPipe();

  it('returns valid uuid v4 values', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    expect(pipe.transform(id)).toBe(id);
  });

  it('throws I18nValidationException for invalid uuid', () => {
    expect(() => pipe.transform('not-a-uuid')).toThrow(I18nValidationException);
  });
});
