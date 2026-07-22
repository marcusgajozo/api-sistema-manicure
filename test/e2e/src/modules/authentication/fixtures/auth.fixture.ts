export interface AuthSignUpPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthSignInPayload {
  email: string;
  password: string;
}

export function createSignUpPayload(
  overrides: Partial<AuthSignUpPayload> = {},
): AuthSignUpPayload {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: 'Jane Doe',
    phone: '11999999999',
    email: `jane-${unique}@example.com`,
    password: 'password123',
    passwordConfirm: 'password123',
    ...overrides,
  };
}

export function createSignInPayload(
  email: string,
  password = 'password123',
): AuthSignInPayload {
  return { email, password };
}
