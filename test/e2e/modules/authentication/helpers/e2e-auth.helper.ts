import {
  createSignInPayload,
  createSignUpPayload,
} from '@test/e2e/modules/authentication/fixtures/auth.fixture';
import request, { Response } from 'supertest';

export function getSetCookieHeaders(response: Response): string[] {
  const cookies = response.headers['set-cookie'];

  if (!cookies) {
    return [];
  }

  return Array.isArray(cookies) ? cookies : [cookies];
}

export async function authenticateE2eUser(
  httpServer: Parameters<typeof request>[0],
): Promise<string[]> {
  const payload = createSignUpPayload();

  await request(httpServer)
    .post('/authentication/sign-up')
    .send(payload)
    .expect(201);

  const signInResponse = await request(httpServer)
    .post('/authentication/sign-in')
    .send(createSignInPayload(payload.email, payload.password))
    .expect(200);

  return getSetCookieHeaders(signInResponse);
}
