import { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  E2eAppContext,
} from '@test/e2e/modules/app/create-e2e-app';
import { createAppointmentPayload } from '@test/e2e/modules/appointments/fixtures/appointment.fixture';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
import { createClientPayload } from '@test/e2e/modules/clients/fixtures/client.fixture';
import {
  dropE2eSchema,
  resetE2eDatabase,
} from '@test/e2e/modules/database/helpers/e2e-database.helper';
import { createProcedurePayload } from '@test/e2e/modules/procedures/fixtures/procedure.fixture';
import { createTimeOffPayload } from '@test/e2e/modules/time-offs/fixtures/time-off.fixture';
import request from 'supertest';
import { DataSource } from 'typeorm';

interface ApiErrorBody {
  message: string | string[];
}

interface AppointmentResponseBody {
  data: {
    id: string;
    procedureName: string;
    clientName: string;
    startDate: string;
    endDate: string;
  };
}

interface PaginatedAppointmentsResponseBody {
  data: Array<{
    id: string;
    procedureName: string;
    clientName: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

describe('Appointments (e2e)', () => {
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

  async function createAppointmentAndGetId(cookies: string[]): Promise<string> {
    await request(httpServer)
      .post('/appointments')
      .set('Cookie', cookies)
      .send(createAppointmentPayload())
      .expect(201);

    const listResponse = await request(httpServer)
      .get('/appointments')
      .set('Cookie', cookies)
      .expect(200);

    const listBody = listResponse.body as PaginatedAppointmentsResponseBody;
    return listBody.data[0].id;
  }

  describe('POST /appointments', () => {
    it('creates an appointment for the authenticated user', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createAppointmentPayload();

      await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/appointments')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedAppointmentsResponseBody;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].procedureName).toBe(payload.procedureName);
      expect(body.data[0].clientName).toBe(payload.clientName);
      expect(body.meta.totalCount).toBe(1);
    });

    it('creates an appointment using clientId and procedureId', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/clients')
        .set('Cookie', cookies)
        .send(createClientPayload())
        .expect(201);

      const clientsResponse = await request(httpServer)
        .get('/clients')
        .set('Cookie', cookies)
        .expect(200);

      const clientId = (
        clientsResponse.body as PaginatedAppointmentsResponseBody
      ).data[0].id;

      await request(httpServer)
        .post('/procedures')
        .set('Cookie', cookies)
        .send(createProcedurePayload())
        .expect(201);

      const proceduresResponse = await request(httpServer)
        .get('/procedures')
        .set('Cookie', cookies)
        .expect(200);

      const procedureId = (
        proceduresResponse.body as PaginatedAppointmentsResponseBody
      ).data[0].id;

      await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send(
          createAppointmentPayload({
            clientId,
            procedureId,
            clientName: undefined,
            phoneClient: undefined,
            procedureName: undefined,
            procedurePrice: undefined,
          }),
        )
        .expect(201);

      const listResponse = await request(httpServer)
        .get('/appointments')
        .set('Cookie', cookies)
        .expect(200);

      const body = listResponse.body as PaginatedAppointmentsResponseBody;
      expect(body.data).toHaveLength(1);
    });

    it('returns 401 without authentication', async () => {
      await request(httpServer)
        .post('/appointments')
        .send(createAppointmentPayload())
        .expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send({ clientName: 'Maria Silva' })
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 409 when another appointment overlaps', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createAppointmentPayload();

      await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send(
          createAppointmentPayload({
            startDate: '2026-07-10T09:30:00.000Z',
            endDate: '2026-07-10T10:30:00.000Z',
          }),
        )
        .expect(409);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 409 when a time off overlaps', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      await request(httpServer)
        .post('/time-offs')
        .set('Cookie', cookies)
        .send(createTimeOffPayload())
        .expect(201);

      const response = await request(httpServer)
        .post('/appointments')
        .set('Cookie', cookies)
        .send(
          createAppointmentPayload({
            startDate: '2026-07-02T09:00:00.000Z',
            endDate: '2026-07-02T10:00:00.000Z',
          }),
        )
        .expect(409);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /appointments/:id', () => {
    it('returns an appointment by id', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const payload = createAppointmentPayload();
      const appointmentId = await createAppointmentAndGetId(cookies);

      const response = await request(httpServer)
        .get(`/appointments/${appointmentId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as AppointmentResponseBody;
      expect(body.data.id).toBe(appointmentId);
      expect(body.data.procedureName).toBe(payload.procedureName);
      expect(body.data.clientName).toBe(payload.clientName);
    });

    it('returns 404 when the appointment does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/appointments/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 400 for invalid uuid', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .get('/appointments/invalid-id')
        .set('Cookie', cookies)
        .expect(400);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });

    it('returns 404 when another user tries to access the appointment', async () => {
      const ownerCookies = await authenticateE2eUser(httpServer);
      const otherUserCookies = await authenticateE2eUser(httpServer);
      const appointmentId = await createAppointmentAndGetId(ownerCookies);

      await request(httpServer)
        .get(`/appointments/${appointmentId}`)
        .set('Cookie', otherUserCookies)
        .expect(404);
    });
  });

  describe('PATCH /appointments/:id', () => {
    it('updates an appointment', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const appointmentId = await createAppointmentAndGetId(cookies);

      await request(httpServer)
        .patch(`/appointments/${appointmentId}`)
        .set('Cookie', cookies)
        .send({ clientName: 'Ana Souza' })
        .expect(200);

      const response = await request(httpServer)
        .get(`/appointments/${appointmentId}`)
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as AppointmentResponseBody;
      expect(body.data.clientName).toBe('Ana Souza');
    });

    it('returns 404 when the appointment does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .patch('/appointments/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .send({ clientName: 'Ana Souza' })
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('removes an appointment', async () => {
      const cookies = await authenticateE2eUser(httpServer);
      const appointmentId = await createAppointmentAndGetId(cookies);

      await request(httpServer)
        .delete(`/appointments/${appointmentId}`)
        .set('Cookie', cookies)
        .expect(204);

      await request(httpServer)
        .get(`/appointments/${appointmentId}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 404 when the appointment does not exist', async () => {
      const cookies = await authenticateE2eUser(httpServer);

      const response = await request(httpServer)
        .delete('/appointments/550e8400-e29b-41d4-a716-446655440000')
        .set('Cookie', cookies)
        .expect(404);

      const body = response.body as ApiErrorBody;
      expect(body.message).toBeDefined();
    });
  });
});
