# Plano de Testes E2E — `procedures`

Configuração de testes end-to-end do módulo `procedures` do zero, ancorada na
documentação oficial do Jest (sem depender das convenções internas do projeto).

## Referências

- Configuração do Jest: https://jestjs.io/docs/configuration
- CLI do Jest: https://jestjs.io/docs/cli
- `--config`: https://jestjs.io/docs/cli#--configpath
- `rootDir`: https://jestjs.io/docs/configuration#rootdir-string
- `testMatch`: https://jestjs.io/docs/configuration#testmatch-arraystring
- `testRegex`: https://jestjs.io/docs/configuration#testregex-string--arraystring
- `transform`: https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
- `moduleNameMapper`: https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring
- `setupFiles`: https://jestjs.io/docs/configuration#setupfiles-array
- `setupFilesAfterEnv`: https://jestjs.io/docs/configuration#setupfilesafterenv-array
- `globalSetup`: https://jestjs.io/docs/configuration#globalsetup-string
- `globalTeardown`: https://jestjs.io/docs/configuration#globalteardown-string
- `testEnvironment`: https://jestjs.io/docs/configuration#testenvironment-node--jsdom--string
- `testTimeout`: https://jestjs.io/docs/configuration#testtimeout-number
- `maxWorkers`: https://jestjs.io/docs/configuration#maxworkers-number--string
- ts-jest (instalação): https://kulshekhar.github.io/ts-jest/docs/getting-started/installation
- ts-jest (paths mapping): https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
- NestJS testing: https://docs.nestjs.com/fundamentals/testing
- NestJS supertest: https://docs.nestjs.com/recipes/supertest
- supertest: https://github.com/ladjs/supertest

## Decisões de configuração

| Tema            | Decisão                                                | Motivo (fonte)                                                                     |
| --------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Config dedicada | `test/jest-e2e.json`, via `--config`                   | Isolar E2E dos unitários (`--config`)                                              |
| Formato         | JSON                                                   | Config precisa ser JSON-serializable; `.ts` exigiria `ts-node`                     |
| `rootDir`       | `.` (pasta `test/`)                                    | Token `<rootDir>` previsível                                                       |
| Descoberta      | sufixo `.e2e-spec.ts` + `testRegex`                    | O default pegaria `*.spec.ts`; `testMatch` e `testRegex` são mutuamente exclusivos |
| Transform       | `ts-jest` com `tsconfig.e2e.json` (`module: commonjs`) | Evita conflito com ESM/`nodenext` do tsconfig principal                            |
| Aliases         | `moduleNameMapper` (`@/`, `@src/`, `@test/`)           | Jest não lê `paths` do tsconfig em runtime                                         |
| Ambiente        | `testEnvironment: "node"`                              | Robô HTTP puro, sem `jsdom`                                                        |
| Env             | `setupFiles`                                           | Roda antes dos imports; `ConfigFactory` lê `process.env` na inicialização          |
| Ajustes/arquivo | `setupFilesAfterEnv`                                   | `jest.setTimeout` e globais                                                        |
| Provisionar DB  | `globalSetup`/`globalTeardown`                         | Roda uma vez por execução                                                          |
| Timeout         | 30000 ms                                               | Default é 5000 ms; subir app + DB estoura                                          |
| Paralelismo     | `maxWorkers: 1`                                        | Banco compartilhado exige serial                                                   |

> `globalSetup` roda no processo principal e NÃO herda o `process.env` do
> `setupFiles`. Centralizar o carregamento em `e2e-env.ts` e chamar nos dois.

## Estrutura de arquivos

```text
test/
├── jest-e2e.json
├── tsconfig.e2e.json
└── e2e/
    ├── setup/
    │   ├── e2e-env.ts          # carrega .env + overrides
    │   ├── load-e2e-env.ts     # setupFiles
    │   ├── jest-e2e.setup.ts   # setupFilesAfterEnv
    │   ├── global-setup.ts     # cria DB + migrations (uma vez)
    │   └── global-teardown.ts  # dropa DB
    ├── helpers/
    │   └── e2e-auth.helper.ts
    └── modules/
        ├── app/create-e2e-app.ts
        └── procedures/
            ├── procedures.e2e-spec.ts
            └── fixtures/procedure.fixture.ts
```

## Arquivos

### test/jest-e2e.json

```json
{
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": "\\.e2e-spec\\.ts$",
  "moduleFileExtensions": ["js", "json", "ts"],
  "transform": {
    "^.+\\.(t|j)s$": ["ts-jest", { "tsconfig": "tsconfig.e2e.json" }]
  },
  "moduleNameMapper": {
    "^@src/(.*)$": "<rootDir>/../src/$1",
    "^@/(.*)$": "<rootDir>/../src/$1",
    "^@test/(.*)$": "<rootDir>/$1"
  },
  "setupFiles": ["<rootDir>/e2e/setup/load-e2e-env.ts"],
  "setupFilesAfterEnv": ["<rootDir>/e2e/setup/jest-e2e.setup.ts"],
  "globalSetup": "<rootDir>/e2e/setup/global-setup.ts",
  "globalTeardown": "<rootDir>/e2e/setup/global-teardown.ts",
  "testTimeout": 30000,
  "maxWorkers": 1
}
```

### test/tsconfig.e2e.json

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "baseUrl": "..",
    "rootDir": "..",
    "types": ["jest", "node"],
    "paths": {
      "@/*": ["src/*"],
      "@src/*": ["src/*"],
      "@test/*": ["test/*"]
    }
  },
  "include": ["e2e/**/*", "**/*.e2e-spec.ts"]
}
```

### test/e2e/setup/e2e-env.ts

```ts
import { config } from 'dotenv';
import { resolve } from 'path';

export function loadE2eEnv(): void {
  config({ path: resolve(__dirname, '../../../.env') });
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
  process.env.DATABASE_NAME =
    process.env.DATABASE_E2E_NAME ?? 'manicure_db_e2e';
}
```

### test/e2e/setup/load-e2e-env.ts

```ts
import { loadE2eEnv } from './e2e-env';

loadE2eEnv();
```

### test/e2e/setup/jest-e2e.setup.ts

```ts
import { loadE2eEnv } from './e2e-env';

loadE2eEnv();
jest.setTimeout(30000);
```

### test/e2e/setup/global-setup.ts

```ts
import { Client } from 'pg';
import { join } from 'path';
import { DataSource } from 'typeorm';

import { loadE2eEnv } from './e2e-env';

export default async function globalSetup(): Promise<void> {
  loadE2eEnv();

  const database = process.env.DATABASE_NAME ?? 'manicure_db_e2e';

  const admin = new Client({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: 'postgres',
  });

  await admin.connect();
  const existing = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [database],
  );
  if (existing.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${database}"`);
  }
  await admin.end();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database,
    migrations: [
      join(__dirname, '..', '..', '..', 'database', 'migrations', '*.ts'),
    ],
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
```

### test/e2e/setup/global-teardown.ts

```ts
import { Client } from 'pg';

import { loadE2eEnv } from './e2e-env';

export default async function globalTeardown(): Promise<void> {
  loadE2eEnv();

  const database = process.env.DATABASE_NAME ?? 'manicure_db_e2e';

  const admin = new Client({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: 'postgres',
  });

  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
}
```

### test/e2e/modules/app/create-e2e-app.ts

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { I18nValidationPipe } from 'nestjs-i18n';

import { AppModule } from '@/modules/app/app.module';

export async function createE2eApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}
```

### test/e2e/helpers/e2e-auth.helper.ts

```ts
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AuthenticationEntity } from '@/modules/authentication/entities/authentication.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

export async function authenticateE2eUser(
  app: INestApplication,
): Promise<string> {
  const dataSource = app.get(DataSource);
  const email = `e2e-${Date.now()}-${Math.random()}@example.com`;
  const password = 'password123';

  const user = await dataSource.getRepository(UserEntity).save({
    name: 'E2E User',
    phone: '11999999999',
  });

  await dataSource.getRepository(AuthenticationEntity).save({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    userId: user.id,
  });

  const response = await request(app.getHttpServer())
    .post('/authentication/sign-in')
    .send({ email, password })
    .expect(200);

  return response.headers['set-cookie'].join(';');
}
```

### test/e2e/modules/procedures/fixtures/procedure.fixture.ts

```ts
export function createProcedurePayload() {
  return {
    name: 'Manicure',
    description: 'Esmaltação simples',
    price: 5000,
    returnDays: 15,
    durationMinutes: 60,
  };
}
```

### test/e2e/modules/procedures/procedures.e2e-spec.ts

```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { authenticateE2eUser } from '@test/e2e/helpers/e2e-auth.helper';
import { createE2eApp } from '@test/e2e/modules/app/create-e2e-app';

import { createProcedurePayload } from './fixtures/procedure.fixture';

describe('Procedures (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  beforeEach(async () => {
    await app
      .get(DataSource)
      .query(
        'TRUNCATE "procedures", "authentications", "users" RESTART IDENTITY CASCADE',
      );
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve retornar 401 sem autenticação', async () => {
    await request(app.getHttpServer()).get('/procedures').expect(401);
  });

  it('deve criar e listar um procedimento do usuário', async () => {
    const cookies = await authenticateE2eUser(app);

    await request(app.getHttpServer())
      .post('/procedures')
      .set('Cookie', cookies)
      .send(createProcedurePayload())
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/procedures')
      .set('Cookie', cookies)
      .expect(200);

    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ name: 'Manicure', price: 5000 });
  });

  it('deve retornar 400 para UUID inválido', async () => {
    const cookies = await authenticateE2eUser(app);

    await request(app.getHttpServer())
      .get('/procedures/nao-e-uuid')
      .set('Cookie', cookies)
      .expect(400);
  });

  it('deve retornar 400 para corpo inválido', async () => {
    const cookies = await authenticateE2eUser(app);

    await request(app.getHttpServer())
      .post('/procedures')
      .set('Cookie', cookies)
      .send({ name: '', price: -1, returnDays: 0, durationMinutes: 0 })
      .expect(400);
  });

  it('deve retornar 404 ao acessar procedimento de outro usuário', async () => {
    const ownerCookies = await authenticateE2eUser(app);
    const otherCookies = await authenticateE2eUser(app);

    await request(app.getHttpServer())
      .post('/procedures')
      .set('Cookie', ownerCookies)
      .send(createProcedurePayload())
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/procedures')
      .set('Cookie', ownerCookies)
      .expect(200);

    const id = list.body.data[0].id;

    await request(app.getHttpServer())
      .get(`/procedures/${id}`)
      .set('Cookie', otherCookies)
      .expect(404);
  });

  it('deve atualizar e remover um procedimento do usuário', async () => {
    const cookies = await authenticateE2eUser(app);

    await request(app.getHttpServer())
      .post('/procedures')
      .set('Cookie', cookies)
      .send(createProcedurePayload())
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/procedures')
      .set('Cookie', cookies)
      .expect(200);

    const id = list.body.data[0].id;

    await request(app.getHttpServer())
      .patch(`/procedures/${id}`)
      .set('Cookie', cookies)
      .send({ price: 7000 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/procedures/${id}`)
      .set('Cookie', cookies)
      .expect(200);
  });
});
```

### package.json (script)

```json
{
  "scripts": {
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## Execução

```bash
pnpm run docker:up   # Postgres no ar
pnpm run test:e2e
```

## Pontos em aberto

1. Isolamento: banco separado (proposto, sem tocar em src) vs schema
   (`search_path`, exigiria alterar `src/modules/database/*`).
2. Formato do config: JSON (proposto) vs `.ts` (exige `ts-node` + docblock).
3. Verificar interação com `test/jest.setup.ts` e `test/tsconfig.json` já
   referenciados por `jest.config.mjs` / `eslint.config.mjs`.
