import { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  E2eAppContext,
} from '@test/e2e/modules/app/create-e2e-app';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
import { createClientPayload } from '@test/e2e/modules/clients/fixtures/client.fixture';
import {
  dropE2eSchema,
  resetE2eDatabase,
} from '@test/e2e/modules/database/helpers/e2e-database.helper';
import request from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface ClientResponseBody {
  data: {
    id: string;
    name: string;
    phone: string;
  };
}

interface PaginatedClientsResponseBody {
  data: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

describe('Clients (e2e)', () => {
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

  describe('POST /clients', () => {
    it('creates a client for the authenticated user', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createClientPayload();

      await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedClientsResponseBody;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe(payload.name);
      expect(body.data[0].phone).toBe(payload.phone);
      expect(body.meta.totalCount).toBe(1);
    });

    it('returns 401 without authentication', async () => {
      await request(httpServer)
        .post('/clients')
        .send(createClientPayload())
        .expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send({ name: 'Maria Silva' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /clients/:id', () => {
    it('returns a client by id', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createClientPayload();

      await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedClientsResponseBody;
      const clientId = listBody.data[0].id;

      const response = await request(httpServer)
        .get(`/clients/${clientId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ClientResponseBody;
      expect(body.data.id).toBe(clientId);
      expect(body.data.name).toBe(payload.name);
      expect(body.data.phone).toBe(payload.phone);
    });

    it('returns 404 when the client does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/clients/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid uuid', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/clients/invalid-id')
        .set('Cookie', cookies)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 404 when another user tries to access the client', async () => {
      const ownerCookies = await authenticateE2eUser(httpServer);
      const otherUserCookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/clients')
        .set('Cookie', ownerCookies)
        .send(createClientPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', ownerCookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedClientsResponseBody;
      const clientId = listBody.data[0].id;

      await request(httpServer)
        .get(`/clients/${clientId}`)
        .set('Cookie', otherUserCookies)
        .expect(404);
    });
  });

  describe('PATCH /clients/:id', () => {
    it('updates a client', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send(createClientPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedClientsResponseBody;
      const clientId = listBody.data[0].id;

      await request(httpServer)
        .patch(`/clients/${clientId}`)
        .set('Cookie', cookies)
        .send({ phone: '11988887777' })
        .expect(200);

      const response = await request(httpServer)
        .get(`/clients/${clientId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ClientResponseBody;
      expect(body.data.phone).toBe('11988887777');
    });

    it('returns 404 when the client does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .patch('/clients/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .send({ phone: '11988887777' })
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('DELETE /clients/:id', () => {
    it('removes a client', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send(createClientPayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', cookies)
        .expect(200);

      const listBody = listResponse.body as PaginatedClientsResponseBody;
      const clientId = listBody.data[0].id;

      await request(httpServer)
        .delete(`/clients/${clientId}`)
        .set('Cookie', cookies)
        .expect(204);

      await request(httpServer)
        .get(`/clients/${clientId}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 404 when the client does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .delete('/clients/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
