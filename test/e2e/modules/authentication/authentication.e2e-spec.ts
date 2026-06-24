import { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  E2eAppContext,
} from '@test/e2e/modules/app/create-e2e-app';
import {
  createSignInPayload,
  createSignUpPayload,
} from '@test/e2e/modules/authentication/fixtures/auth.fixture';
import {
  dropE2eSchema,
  resetE2eDatabase,
} from '@test/e2e/modules/database/helpers/e2e-database.helper';
import request, { Response } from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface SignInResponseBody {
  data: {
    userId: string;
    email: string;
  };
}

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: Parameters<typeof request>[0];

  const cookieName = process.env.JWT_COOKIE_NAME ?? 'access_token';

  beforeAll(async () => {
    const e2eContext: E2eAppContext = await createE2eApp();
    app = e2eContext.app;
    dataSource = e2eContext.dataSource;
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
  });

  beforeEach(async () => {
    await resetE2eDatabase(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dropE2eSchema(dataSource);
    }

    if (app) {
      await app.close();
    }
  });

  function getSetCookieHeaders(response: Response): string[] {
    const cookies = response.headers['set-cookie'];

    if (!cookies) {
      return [];
    }

    return Array.isArray(cookies) ? cookies : [cookies];
  }

  describe('POST /authentication/sign-up', () => {
    it('creates account with valid payload', async () => {
      const payload = createSignUpPayload();

      const response = await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(201);

      expect(response.body as Record<string, never>).toEqual({});
    });

    it('returns 409 when email already exists', async () => {
      const payload = createSignUpPayload();

      await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(409);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const payload = createSignUpPayload({ email: 'invalid-email' });

      const response = await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(httpServer)
        .post('/authentication/sign-up')
        .send({ email: 'user@example.com' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('POST /authentication/sign-in', () => {
    it('sets httpOnly cookie and returns user data without token in body', async () => {
      const payload = createSignUpPayload();

      await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .post('/authentication/sign-in')
        .send(createSignInPayload(payload.email, payload.password))
        .expect(200);

      const cookies = getSetCookieHeaders(response);
      expect(
        cookies.some((cookie) => cookie.startsWith(`${cookieName}=`)),
      ).toBe(true);
      expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);

      const body = response.body as SignInResponseBody;
      expect(typeof body.data.userId).toBe('string');
      expect(body.data.email).toBe(payload.email);
      expect(body.data).not.toHaveProperty('accessToken');
    });

    it('returns 401 for invalid password', async () => {
      const payload = createSignUpPayload();

      await request(httpServer)
        .post('/authentication/sign-up')
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .post('/authentication/sign-in')
        .send(createSignInPayload(payload.email, 'wrong-password'))
        .expect(401);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
      expect(getSetCookieHeaders(response)).toHaveLength(0);
    });

    it('returns 401 when user does not exist', async () => {
      const response = await request(httpServer)
        .post('/authentication/sign-in')
        .send(createSignInPayload('missing@example.com'))
        .expect(401);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid email format', async () => {
      const response = await request(httpServer)
        .post('/authentication/sign-in')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
