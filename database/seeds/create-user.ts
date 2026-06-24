import bcrypt from 'bcryptjs';
import { join } from 'path';
import { DataSource } from 'typeorm';

import { AuthenticationEntity } from '../../src/modules/authentication/entities/authentication.entity';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { getMigrationConnectionOptions } from '../database.config';
import { loadAppEnv } from '../load-env';
import { getSeedUserData } from './user.seed-data';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seedUser(): Promise<void> {
  loadAppEnv();

  const seedData = getSeedUserData();

  const dataSource = new DataSource({
    ...getMigrationConnectionOptions(),
    entities: [
      join(__dirname, '..', '..', 'src', 'modules', '**', '*.entity.{ts,js}'),
    ],
  });

  await dataSource.initialize();

  try {
    const authRepository = dataSource.getRepository(AuthenticationEntity);

    const existingAuth = await authRepository.findOne({
      where: { email: seedData.email },
    });

    if (existingAuth) {
      console.warn(
        `Usuário com e-mail ${seedData.email} já existe. Seed ignorado.`,
      );
      return;
    }

    const passwordHash = await hashPassword(seedData.password);

    await dataSource.transaction(async (manager) => {
      const user = await manager.save(UserEntity, {
        name: seedData.name,
        phone: seedData.phone,
      });

      await manager.save(AuthenticationEntity, {
        email: seedData.email,
        passwordHash,
        userId: user.id,
      });

      console.warn(`Usuário criado: ${user.id} (${seedData.email})`);
    });
  } finally {
    await dataSource.destroy();
  }
}

seedUser().catch((error: unknown) => {
  console.error('Falha ao criar usuário seed:', error);
  process.exit(1);
});
