export interface SeedUserData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export function getSeedUserData(): SeedUserData {
  return {
    name: process.env.SEED_USER_NAME ?? 'Admin',
    phone: process.env.SEED_USER_PHONE ?? '11999999999',
    email: process.env.SEED_USER_EMAIL ?? 'admin@example.com',
    password: process.env.SEED_USER_PASSWORD ?? 'password123',
  };
}
