import {
  buildCorsOptions,
  corsConfigFactory,
  parseCorsOriginWhitelist,
} from './cors.config';

function invokeOriginCheck(
  origin: string | undefined,
  whitelist: string[],
): boolean {
  const callback = jest.fn<void, [Error | null, boolean | undefined]>();
  const { origin: originFn } = buildCorsOptions({ originWhitelist: whitelist });

  originFn(origin, callback);

  const [, allow] = callback.mock.calls[0] ?? [];

  return allow ?? false;
}

describe('parseCorsOriginWhitelist', () => {
  it('returns default localhost origins when env value is missing', () => {
    expect(parseCorsOriginWhitelist()).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]);
  });

  it('returns default localhost origins when env value is empty', () => {
    expect(parseCorsOriginWhitelist('   ')).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]);
  });

  it('parses comma-separated origins and trims whitespace', () => {
    expect(
      parseCorsOriginWhitelist(
        'http://localhost:3000, http://localhost:4200 ,http://127.0.0.1:8080',
      ),
    ).toEqual([
      'http://localhost:3000',
      'http://localhost:4200',
      'http://127.0.0.1:8080',
    ]);
  });
});

describe('corsConfigFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses default whitelist when CORS_ORIGIN_WHITELIST is missing', () => {
    delete process.env.CORS_ORIGIN_WHITELIST;

    expect(corsConfigFactory()).toEqual({
      originWhitelist: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ],
    });
  });

  it('reads CORS_ORIGIN_WHITELIST from environment variables', () => {
    process.env.CORS_ORIGIN_WHITELIST =
      'http://localhost:3000,http://localhost:8080';

    expect(corsConfigFactory()).toEqual({
      originWhitelist: ['http://localhost:3000', 'http://localhost:8080'],
    });
  });
});

describe('buildCorsOptions', () => {
  const whitelist = ['http://localhost:3000', 'http://localhost:5173'];

  it('allows requests without origin header', () => {
    expect(invokeOriginCheck(undefined, whitelist)).toBe(true);
  });

  it('allows whitelisted origins', () => {
    expect(invokeOriginCheck('http://localhost:5173', whitelist)).toBe(true);
  });

  it('rejects origins not in the whitelist', () => {
    expect(invokeOriginCheck('http://evil.example.com', whitelist)).toBe(false);
  });

  it('enables credentials for cookie-based auth', () => {
    expect(buildCorsOptions({ originWhitelist: whitelist }).credentials).toBe(
      true,
    );
  });
});
