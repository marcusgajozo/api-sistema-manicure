import { INestApplication } from '@nestjs/common';
import { NotificationEntity } from '@src/modules/notifications/entities/notification.entity';

interface PaginatedAppointmentsResponseBody {
  data: Array<{ id: string }>;
}
import {
  createE2eApp,
  E2eAppContext,
} from '@test/e2e/modules/app/create-e2e-app';
import { createAppointmentPayload } from '@test/e2e/modules/appointments/fixtures/appointment.fixture';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
import {
  dropE2eSchema,
  resetE2eDatabase,
} from '@test/e2e/modules/database/helpers/e2e-database.helper';
import request from 'supertest';
import { DataSource } from 'typeorm';

describe('Notifications Flow (e2e)', () => {
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

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it('should create notifications when an appointment is created', async () => {
    const cookies = await authenticateE2eUser(httpServer);
    const payload = createAppointmentPayload();

    await request(httpServer)
      .post('/appointments')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    // Give the EventEmitter a brief moment to process the async listener
    await sleep(500);

    const listResponse = await request(httpServer)
      .get('/appointments')
      .set('Cookie', cookies)
      .expect(200);

    const listBody = listResponse.body as PaginatedAppointmentsResponseBody;
    const appointmentId = listBody.data[0].id;

    const notifications = await dataSource
      .getRepository(NotificationEntity)
      .find({
        where: { appointment: { id: appointmentId } },
        order: { scheduledFor: 'ASC' },
        withDeleted: true,
      });

    expect(notifications).toHaveLength(2);
    expect(notifications[0].type).toBe('REMINDER');
    expect(notifications[1].type).toBe('FOLLOW_UP');
  });

  it('should soft delete notifications when an appointment is canceled', async () => {
    const cookies = await authenticateE2eUser(httpServer);
    const payload = createAppointmentPayload();

    await request(httpServer)
      .post('/appointments')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    await sleep(500);

    const listResponse = await request(httpServer)
      .get('/appointments')
      .set('Cookie', cookies)
      .expect(200);

    const listBody = listResponse.body as PaginatedAppointmentsResponseBody;
    const appointmentId = listBody.data[0].id;

    await request(httpServer)
      .delete(`/appointments/${appointmentId}`)
      .set('Cookie', cookies)
      .expect(204);

    await sleep(500);

    // Query checking the deleted_at column
    const notifications = await dataSource
      .getRepository(NotificationEntity)
      .find({
        where: { appointment: { id: appointmentId } },
        withDeleted: true,
      });

    // Expect 0 because ON DELETE CASCADE hard deletes the notifications
    expect(notifications).toHaveLength(0);
  });

  it('should recreate notifications when an appointment is rescheduled', async () => {
    const cookies = await authenticateE2eUser(httpServer);
    const payload = createAppointmentPayload({
      startDate: '2026-07-01T09:00:00',
      endDate: '2026-07-01T10:00:00',
    });

    await request(httpServer)
      .post('/appointments')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    await sleep(500);

    const listResponse = await request(httpServer)
      .get('/appointments')
      .set('Cookie', cookies)
      .expect(200);

    const listBody = listResponse.body as PaginatedAppointmentsResponseBody;
    const appointmentId = listBody.data[0].id;

    // Reschedule appointment (change date)
    await request(httpServer)
      .patch(`/appointments/${appointmentId}`)
      .set('Cookie', cookies)
      .send({
        startDate: '2026-07-02T09:00:00',
        endDate: '2026-07-02T10:00:00',
      })
      .expect(200);

    await sleep(500);

    const allNotifications = await dataSource
      .getRepository(NotificationEntity)
      .find({
        where: { appointment: { id: appointmentId } },
        order: { createdAt: 'ASC' },
        withDeleted: true,
      });

    // 2 canceled (soft deleted) + 2 new (active)
    expect(allNotifications).toHaveLength(4);

    const activeNotifications = allNotifications.filter(
      (n: NotificationEntity) => n.deletedAt === null,
    );
    const deletedNotifications = allNotifications.filter(
      (n: NotificationEntity) => n.deletedAt !== null,
    );

    expect(activeNotifications).toHaveLength(2);
    expect(deletedNotifications).toHaveLength(2);
  });
});
