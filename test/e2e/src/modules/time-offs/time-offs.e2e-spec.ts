import { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  E2eAppContext,
} from '@test/e2e/modules/app/create-e2e-app';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
import {
  dropE2eSchema,
  resetE2eDatabase,
} from '@test/e2e/modules/database/helpers/e2e-database.helper';
import { createTimeOffPayload } from '@test/e2e/modules/time-offs/fixtures/time-off.fixture';
import request from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface TimeOffResponseBody {
  data: {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
}

interface PaginatedTimeOffsResponseBody {
  data: Array<{
    id: string;
    reason: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

describe('TimeOffs (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: Parameters<typeof request>[0];

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

  describe('POST /time-offs', () => {
    it('creates a time off for the authenticated user', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createTimeOffPayload();

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/time-offs')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedTimeOffsResponseBody;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].reason).toBe(payload.reason);
      expect(body.meta.totalCount).toBe(1);
    });

    it('returns 401 without authentication', async () => {
      await request(httpServer)
        .post('/time-offs')
        .send(createTimeOffPayload())
        .expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send({ reason: 'Férias' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /time-offs/:id', () => {
    it('returns a time off by id', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createTimeOffPayload();

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/time-offs')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedTimeOffsResponseBody;
      const timeOffId = listBody.data[0].id;

      const response = await request(httpServer)
        .get(`/time-offs/${timeOffId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as TimeOffResponseBody;
      expect(body.data.id).toBe(timeOffId);
      expect(body.data.reason).toBe(payload.reason);
    });

    it('returns 404 when the time off does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/time-offs/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid uuid', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/time-offs/invalid-id')
        .set('Cookie', cookies)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 404 when another user tries to access the time off', async () => {
      const ownerCookies = await authenticateE2eUser(httpServer);
      const otherUserCookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', ownerCookies)
        .send(createTimeOffPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/time-offs')
        .set('Cookie', ownerCookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedTimeOffsResponseBody;
      const timeOffId = listBody.data[0].id;

      await request(httpServer)
        .get(`/time-offs/${timeOffId}`)
        .set('Cookie', otherUserCookies)
        .expect(404);
    });
  });

  describe('PATCH /time-offs/:id', () => {
    it('updates a time off', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send(createTimeOffPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/time-offs')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedTimeOffsResponseBody;
      const timeOffId = listBody.data[0].id;

      await request(httpServer)
        .patch(`/time-offs/${timeOffId}`)
        .set('Cookie', cookies)
        .send({ reason: 'Viagem' })
        .expect(200);

      const response = await request(httpServer)
        .get(`/time-offs/${timeOffId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as TimeOffResponseBody;
      expect(body.data.reason).toBe('Viagem');
    });

    it('returns 404 when the time off does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .patch('/time-offs/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .send({ reason: 'Viagem' })
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('DELETE /time-offs/:id', () => {
    it('removes a time off', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send(createTimeOffPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/time-offs')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedTimeOffsResponseBody;
      const timeOffId = listBody.data[0].id;

      await request(httpServer)
        .delete(`/time-offs/${timeOffId}`)
        .set('Cookie', cookies)
        .expect(204);

      await request(httpServer)
        .get(`/time-offs/${timeOffId}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 404 when the time off does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .delete('/time-offs/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
