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
import { createProcedurePayload } from '@test/e2e/modules/procedures/fixtures/procedure.fixture';
import request from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface ProcedureResponseBody {
  data: {
    id: string;
    name: string;
    description: string;
    price: number;
    returnDays: number;
    durationMinutes: number;
  };
}

interface PaginatedProceduresResponseBody {
  data: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

describe('Procedures (e2e)', () => {
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

  describe('POST /procedures', () => {
    it('creates a procedure for the authenticated user', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createProcedurePayload();

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedProceduresResponseBody;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe(payload.name);
      expect(body.data[0].price).toBe(payload.price);
      expect(body.meta.totalCount).toBe(1);
    });

    it('returns 401 without authentication', async () => {
      await request(httpServer)
        .post('/procedures')
        .send(createProcedurePayload())
        .expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send({ name: 'Manicure' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /procedures/:id', () => {
    it('returns a procedure by id', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createProcedurePayload();

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedProceduresResponseBody;
      const procedureId = listBody.data[0].id;

      const response = await request(httpServer)
        .get(`/procedures/${procedureId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ProcedureResponseBody;
      expect(body.data.id).toBe(procedureId);
      expect(body.data.name).toBe(payload.name);
      expect(body.data.description).toBe(payload.description);
    });

    it('returns 404 when the procedure does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/procedures/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid uuid', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/procedures/invalid-id')
        .set('Cookie', cookies)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 404 when another user tries to access the procedure', async () => {
      const ownerCookies = await authenticateE2eUser(httpServer);
      const otherUserCookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', ownerCookies)
        .send(createProcedurePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', ownerCookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedProceduresResponseBody;
      const procedureId = listBody.data[0].id;

      await request(httpServer)
        .get(`/procedures/${procedureId}`)
        .set('Cookie', otherUserCookies)
        .expect(404);
    });
  });

  describe('PATCH /procedures/:id', () => {
    it('updates a procedure', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send(createProcedurePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedProceduresResponseBody;
      const procedureId = listBody.data[0].id;

      await request(httpServer)
        .patch(`/procedures/${procedureId}`)
        .set('Cookie', cookies)
        .send({ name: 'Pedicure' })
        .expect(200);

      const response = await request(httpServer)
        .get(`/procedures/${procedureId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ProcedureResponseBody;
      expect(body.data.name).toBe('Pedicure');
    });

    it('returns 404 when the procedure does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .patch('/procedures/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .send({ name: 'Pedicure' })
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('DELETE /procedures/:id', () => {
    it('removes a procedure', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send(createProcedurePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedProceduresResponseBody;
      const procedureId = listBody.data[0].id;

      await request(httpServer)
        .delete(`/procedures/${procedureId}`)
        .set('Cookie', cookies)
        .expect(200);

      await request(httpServer)
        .get(`/procedures/${procedureId}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 404 when the procedure does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .delete('/procedures/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
