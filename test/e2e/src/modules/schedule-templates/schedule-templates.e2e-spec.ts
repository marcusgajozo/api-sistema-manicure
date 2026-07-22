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
import { createScheduleTemplatePayload } from '@test/e2e/modules/schedule-templates/fixtures/schedule-template.fixture';
import request from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface ScheduleTemplateResponseBody {
  data: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
}

interface PaginatedScheduleTemplatesResponseBody {
  data: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

describe('ScheduleTemplates (e2e)', () => {
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

  describe('POST /schedule-templates', () => {
    it('creates a schedule template for the authenticated user', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createScheduleTemplatePayload();

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/schedule-templates')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedScheduleTemplatesResponseBody;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dayOfWeek).toBe(payload.dayOfWeek);
      expect(body.data[0].startTime).toBe('09:00:00');
      expect(body.data[0].endTime).toBe('12:00:00');
      expect(body.meta.totalCount).toBe(1);
    });

    it('returns 409 when templates overlap on the same day', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(createScheduleTemplatePayload())
        .expect(201);

      const response = await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(
          createScheduleTemplatePayload({
            startTime: '10:00',
            endTime: '13:00',
          }),
        )
        .expect(409);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 401 without authentication', async () => {
      await request(httpServer)
        .post('/schedule-templates')
        .send(createScheduleTemplatePayload())
        .expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send({ dayOfWeek: 'monday' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /schedule-templates/:id', () => {
    it('returns a schedule template by id', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createScheduleTemplatePayload();

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/schedule-templates')
        .set('Cookie', cookies)
        .expect(200);

      const listBody =
        listResponse.body as PaginatedScheduleTemplatesResponseBody;
      const scheduleTemplateId = listBody.data[0].id;

      const response = await request(httpServer)
        .get(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ScheduleTemplateResponseBody;
      expect(body.data.id).toBe(scheduleTemplateId);
      expect(body.data.dayOfWeek).toBe(payload.dayOfWeek);
    });

    it('returns 404 when the schedule template does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/schedule-templates/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid uuid', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/schedule-templates/invalid-id')
        .set('Cookie', cookies)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 404 when another user tries to access the schedule template', async () => {
      const ownerCookies = await authenticateE2eUser(httpServer);
      const otherUserCookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', ownerCookies)
        .send(createScheduleTemplatePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/schedule-templates')
        .set('Cookie', ownerCookies)
        .expect(200);

      const listBody =
        listResponse.body as PaginatedScheduleTemplatesResponseBody;
      const scheduleTemplateId = listBody.data[0].id;

      await request(httpServer)
        .get(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', otherUserCookies)
        .expect(404);
    });
  });

  describe('PATCH /schedule-templates/:id', () => {
    it('updates a schedule template', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(createScheduleTemplatePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/schedule-templates')
        .set('Cookie', cookies)
        .expect(200);

      const listBody =
        listResponse.body as PaginatedScheduleTemplatesResponseBody;
      const scheduleTemplateId = listBody.data[0].id;

      await request(httpServer)
        .patch(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', cookies)
        .send({ startTime: '10:00' })
        .expect(200);

      const response = await request(httpServer)
        .get(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as ScheduleTemplateResponseBody;
      expect(body.data.startTime).toBe('10:00:00');
    });

    it('returns 404 when the schedule template does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .patch('/schedule-templates/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .send({ startTime: '10:00' })
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('DELETE /schedule-templates/:id', () => {
    it('removes a schedule template', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/schedule-templates')
        .set('Cookie', cookies)
        .send(createScheduleTemplatePayload())
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/schedule-templates')
        .set('Cookie', cookies)
        .expect(200);

      const listBody =
        listResponse.body as PaginatedScheduleTemplatesResponseBody;
      const scheduleTemplateId = listBody.data[0].id;

      await request(httpServer)
        .delete(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', cookies)
        .expect(204);

      await request(httpServer)
        .get(`/schedule-templates/${scheduleTemplateId}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 404 when the schedule template does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .delete('/schedule-templates/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
