# Plano de Migração do Módulo `procedures` para Clean Architecture

Documento de execução manual. Segue `docs/padrao-arquitetura.md` (padrão-alvo), `docs/guia-refatoracao.md` (passo a passo geral), `docs/guia-testes.md` (testes) e as regras absolutas de `AGENTS.md`.

- **Objetivo**: migrar `src/modules/procedures` do padrão legado (NestJS REST com `controllers/`, `services/`, `dto/`, `entities/`) para o padrão-alvo (`domain/`, `application/`, `infrastructure/`, `presentation/`).
- **Invariante central**: **sem mudança de comportamento**. Rotas, verbos, status codes e corpo de resposta permanecem iguais.
- **Branch**: `refatora-procedures`, em MR próprio.
- **Ordem**: cada fase termina com a verificação indicada antes de avançar.

> Leia primeiro: `docs/padrao-arquitetura.md` (seções 4 a 10), `docs/guia-refatoracao.md` (seções 2, 3 e 5) e `docs/guia-testes.md`.

---

## 1. Diagnóstico do estado atual

### 1.1. Arquivos legados do módulo

```
src/modules/procedures/
├── procedures.module.ts
├── controllers/procedures.controller.ts (+ .spec.ts)
├── services/procedures.service.ts (+ .spec.ts)
├── dto/create-procedure.dto.ts (+ .spec.ts)
├── dto/update-procedure.dto.ts (+ .spec.ts)
└── entities/procedure.entity.ts
```

### 1.2. Contrato HTTP atual (preservar)

| Rota              | Verbo  | Sucesso | Corpo de resposta atual                 | Observação                              |
| ----------------- | ------ | ------- | --------------------------------------- | --------------------------------------- |
| `/procedures`     | POST   | 201     | vazio                                   | `create` não retorna corpo              |
| `/procedures`     | GET    | 200     | `PaginatedResponseDto<ProcedureEntity>` | expõe a entidade crua (desvio)          |
| `/procedures/:id` | GET    | 200     | `ResponseDto<ProcedureEntity>`          | 404 se não existir/for de outro usuário |
| `/procedures/:id` | PATCH  | 200     | vazio                                   | `update` não retorna corpo              |
| `/procedures/:id` | DELETE | 200     | vazio                                   | hard delete (desvio)                    |

Todas exigem JWT (guard global). `:id` usa `VerifyUUIDIdPipe` (400 para UUID inválido).

### 1.3. Comportamento a preservar com exatidão

- `findAll` usa `skip: page - 1` (não `(page - 1) * limit`).
- `remove` faz hard delete (`repository.delete`).
- `create`, `update` e `remove` não retornam corpo.
- `findAll` e `findOne` expõem a entidade serializada.

Esses quatro itens são **correções de comportamento** já registradas em `docs/guia-refatoracao.md` seção 5. **Não entram nesta refatoração**; vão em MR separado. Ver seção 3 (Decisões).

### 1.4. Entidade atual (`procedure.entity.ts`)

Tabela `procedures`, estende `BaseEntity` (uuid, `created_at`, `updated_at`, `deleted_at`). Colunas: `name` (text, nullable), `description` (text, nullable), `price` (int, default 0), `return_days` (int, default 0), `duration_minutes` (int, default 0), relação `ManyToOne` com `UserEntity` (`user_id`, not null) e `OneToMany` com `AppointmentEntity`; `RelationId` para `userId` e `appointmentIds`.

### 1.5. Consumidores externos (quebram ao mover/renomear a entidade)

- `src/modules/appointments/entities/appointment.entity.ts` importa `ProcedureEntity` (relação `ManyToOne`).
- `src/modules/users/entities/user.entity.ts` importa `ProcedureEntity` (relação `OneToMany`).
- `src/modules/appointments/services/appointments.service.ts` usa só a relação (`procedure: { id }`), **não** injeta repositório de procedures.
- Ninguém importa `ProceduresService`. Exportar o token no fim é opcional hoje (padrão), mas não há consumidor.

### 1.6. Dependências que ainda não existem no projeto

- `src/common/errors/domain.error.ts` (`DomainError`, `NotFoundError`) — citado em `docs/padrao-arquitetura.md` seção 9, **inexistente hoje**.
- Tipos `PageOptions` e `PagedResult<T>` — citados em `docs/padrao-arquitetura.md` seção 4.3, **inexistentes hoje**.
- `GlobalExceptionFilter` **não** traduz `DomainError`/`NotFoundError` (hoje cai no ramo genérico de `Error` → 500).

### 1.7. Testes existentes

- Unitários: `controllers/procedures.controller.spec.ts` (assere chamadas do service — acoplado à implementação), `services/procedures.service.spec.ts` (assere a query do TypeORM — acoplado), `dto/create-procedure.dto.spec.ts`, `dto/update-procedure.dto.spec.ts` (bons, testam validação).
- E2E: `test/e2e/src/modules/procedures/procedures.e2e-spec.ts` + `fixtures/procedure.fixture.ts`. Cobre POST/GET lista/GET por id/PATCH/DELETE, 401, 400, 404 e isolamento entre usuários. **É a base de caracterização; não deve quebrar.**

---

## 2. Pré-requisitos (fase 0 — código transversal)

Essas mudanças são em `common`/`i18n` e servem a todos os módulos futuros. Faça em commit próprio.

### 2.1. Criar `src/common/errors/domain.error.ts`

```ts
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly args: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(code: string, args: Record<string, unknown> = {}) {
    super(code, args);
    this.name = 'NotFoundError';
  }
}
```

### 2.2. Criar `src/common/types/pagination.type.ts`

```ts
export interface PageOptions {
  page: number;
  limit: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
```

### 2.3. Mapear erros de domínio no `GlobalExceptionFilter`

Em `src/common/filters/global-exception.filter.ts`, importe `DomainError` e `NotFoundError` e trate **antes** do ramo `instanceof HttpException` / `instanceof Error`:

```ts
import { DomainError, NotFoundError } from '@/common/errors/domain.error';

if (exception instanceof NotFoundError) {
  status = HttpStatus.NOT_FOUND;
  errorResponseName = 'Not Found';
  message = this.i18n.t(exception.code, {
    lang,
    args: exception.args,
    defaultValue: exception.code,
  });
} else if (exception instanceof DomainError) {
  status = HttpStatus.BAD_REQUEST;
  errorResponseName = 'Bad Request';
  message = this.i18n.t(exception.code, {
    lang,
    args: exception.args,
    defaultValue: exception.code,
  });
}
```

Adicione um teste de comportamento em `global-exception.filter.spec.ts` (lançar `NotFoundError` → 404; `DomainError` → 400), sem assertar detalhes internos.

### 2.4. Chaves i18n

Adicione em `src/modules/i18n/languages/pt-BR/validation.json`:

```json
"PROCEDURE_NAME_REQUIRED": "O nome do procedimento é obrigatório.",
"PROCEDURE_PRICE_INVALID": "O preço do procedimento é inválido.",
"PROCEDURE_RETURN_DAYS_INVALID": "O prazo de retorno do procedimento é inválido.",
"PROCEDURE_DURATION_INVALID": "A duração do procedimento é inválida.",
"PROCEDURE_NOT_FOUND": "Procedimento não encontrado."
```

`src/generated/i18n.generated.ts` é regenerado automaticamente pelo `nestjs-i18n` (`typesOutputPath` no `i18n.module.ts`) ao subir a app/testes. **Nunca editar à mão.**

### 2.5. Verificação da fase 0

```bash
pnpm run typecheck
pnpm run test
```

---

## 3. Decisões a confirmar antes de começar

A refatoração **não muda comportamento**. Como os desvios da seção 1.3 conflitam com o padrão-alvo, decida explicitamente:

| Tema                   | Durante a refatoração (recomendado)                                                                                         | MR de correção (depois)                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Paginação              | Manter `skip: page - 1` para não mudar comportamento                                                                        | Corrigir para `(page - 1) * limit`                        |
| Delete                 | Manter hard delete (`delete`)                                                                                               | Trocar para `softDelete`                                  |
| Corpo de create/update | Manter sem corpo (201/200 vazios)                                                                                           | Alinhar contrato com `sistema-manicure-web` se necessário |
| Presenter              | Emitir as mesmas chaves hoje serializadas (id, name, description, price, returnDays, durationMinutes, createdAt, updatedAt) | Enxugar/estabilizar o contrato                            |

Se preferir já aplicar o alvo (soft delete, paginação correta), a refatoração deixa de ser “sem mudança de comportamento” e o MR precisa deixar isso explícito. **Recomendação: preservar e corrigir em MRs separados**, como manda `docs/guia-refatoracao.md`.

---

## 4. Passo a passo

### Fase 1 — Testes de caracterização

1. Garanta o Postgres no ar e rode o E2E atual **antes** de mexer no código:
   ```bash
   pnpm run docker:up
   pnpm migration:run
   pnpm run test:e2e
   ```
2. Rode os unitários atuais:
   ```bash
   pnpm run test
   ```
3. Confirme que tudo passa. Este é o baseline. Se algo falhar, resolva antes de continuar.

### Fase 2 — Domain

Crie as pastas e arquivos:

```
src/modules/procedures/domain/
├── types/procedure.type.ts
├── entities/procedure.entity.ts
├── validators/procedure.validator.ts
└── repositories/procedure.repository.ts
```

`types/procedure.type.ts`:

```ts
export interface ProcedureProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  returnDays: number;
  durationMinutes: number;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateProcedureProps = Omit<
  ProcedureProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateProcedureProps = Partial<
  Pick<
    ProcedureProps,
    'name' | 'description' | 'price' | 'returnDays' | 'durationMinutes'
  >
>;
```

`validators/procedure.validator.ts`:

```ts
import { DomainError } from '@/common/errors/domain.error';

import { Procedure } from '../entities/procedure.entity';

export class ProcedureValidator {
  static validate(procedure: Procedure): void {
    if (!procedure.name || procedure.name.trim().length === 0) {
      throw new DomainError('validation.PROCEDURE_NAME_REQUIRED');
    }
    if (!Number.isInteger(procedure.price) || procedure.price < 0) {
      throw new DomainError('validation.PROCEDURE_PRICE_INVALID');
    }
    if (!Number.isInteger(procedure.returnDays) || procedure.returnDays < 0) {
      throw new DomainError('validation.PROCEDURE_RETURN_DAYS_INVALID');
    }
    if (
      !Number.isInteger(procedure.durationMinutes) ||
      procedure.durationMinutes < 0
    ) {
      throw new DomainError('validation.PROCEDURE_DURATION_INVALID');
    }
  }
}
```

`entities/procedure.entity.ts` (classe pura, sem decorators; `create`, `rehydrate`, `changeDetails`):

```ts
import {
  CreateProcedureProps,
  ProcedureProps,
  UpdateProcedureProps,
} from '../types/procedure.type';
import { ProcedureValidator } from '../validators/procedure.validator';

export class Procedure {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public price: number,
    public returnDays: number,
    public durationMinutes: number,
    public userId: string,
    public readonly createdAt?: Date,
    public updatedAt?: Date,
  ) {
    ProcedureValidator.validate(this);
  }

  static create(props: CreateProcedureProps): Procedure {
    return new Procedure(
      '',
      props.name,
      props.description ?? null,
      props.price,
      props.returnDays,
      props.durationMinutes,
      props.userId,
      new Date(),
    );
  }

  static rehydrate(props: ProcedureProps): Procedure {
    return new Procedure(
      props.id,
      props.name,
      props.description ?? null,
      props.price,
      props.returnDays,
      props.durationMinutes,
      props.userId,
      props.createdAt,
      props.updatedAt,
    );
  }

  changeDetails(props: UpdateProcedureProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.price !== undefined) this.price = props.price;
    if (props.returnDays !== undefined) this.returnDays = props.returnDays;
    if (props.durationMinutes !== undefined) {
      this.durationMinutes = props.durationMinutes;
    }
    this.updatedAt = new Date();
    ProcedureValidator.validate(this);
  }
}
```

> Atenção: `domain` **não** pode importar `@nestjs/*`, `typeorm`, `class-validator`, `nestjs-cls`, `rxjs` nem outra camada. `DomainError` é `common`, permitido.

`repositories/procedure.repository.ts`:

```ts
import { PageOptions, PagedResult } from '@/common/types/pagination.type';

import { Procedure } from '../entities/procedure.entity';

export const PROCEDURE_REPOSITORY = Symbol('PROCEDURE_REPOSITORY');

export interface IProcedureRepository {
  findById(id: string, userId: string): Promise<Procedure | null>;
  findAllByUser(
    userId: string,
    options: PageOptions,
  ): Promise<PagedResult<Procedure>>;
  create(procedure: Procedure): Promise<Procedure>;
  update(procedure: Procedure): Promise<Procedure>;
  remove(id: string, userId: string): Promise<void>;
}
```

**Testes da fase 2** (ao lado dos arquivos): `procedure.entity.spec.ts` e `procedure.validator.spec.ts`, testando comportamento (criação válida, rehydrate, `changeDetails`, e recusa de nome vazio / preço, prazo e duração inválidos). Título dos testes começa com “deve”.

### Fase 3 — Application (use cases)

```
src/modules/procedures/application/
├── mappers/procedure.mapper.ts   (opcional; o mapper de persistência fica em infrastructure)
└── usecases/
    ├── create-procedure.usecase.ts
    ├── find-all-procedures.usecase.ts
    ├── find-procedure.usecase.ts
    ├── update-procedure.usecase.ts
    └── remove-procedure.usecase.ts
```

Use cases são classes comuns, **sem `@Injectable()`/`@Inject()`** e sem imports de framework. Um caso de uso por operação do service.

- `CreateProcedureUseCase.execute(props: CreateProcedureProps): Promise<Procedure>` → `Procedure.create(props)` + `repository.create`.
- `FindAllProceduresUseCase.execute(userId: string, options: PageOptions): Promise<PagedResult<Procedure>>` → `repository.findAllByUser`.
- `FindProcedureUseCase.execute(id: string, userId: string): Promise<Procedure>` → `repository.findById`; se `null`, `throw new NotFoundError('validation.PROCEDURE_NOT_FOUND')`.
- `UpdateProcedureUseCase.execute(id: string, props: UpdateProcedureProps, userId: string): Promise<Procedure>` → `findById`; se `null`, `NotFoundError`; `procedure.changeDetails(props)`; `repository.update`.
- `RemoveProcedureUseCase.execute(id: string, userId: string): Promise<void>` → `findById`; se `null`, `NotFoundError`; `repository.remove`.

Exemplo (`create-procedure.usecase.ts`):

```ts
import { Procedure } from '../../domain/entities/procedure.entity';
import { IProcedureRepository } from '../../domain/repositories/procedure.repository';
import { CreateProcedureProps } from '../../domain/types/procedure.type';

export class CreateProcedureUseCase {
  constructor(private readonly procedureRepository: IProcedureRepository) {}

  async execute(props: CreateProcedureProps): Promise<Procedure> {
    const procedure = Procedure.create(props);
    return this.procedureRepository.create(procedure);
  }
}
```

**Testes da fase 3**: um `*.usecase.spec.ts` por use case, com **repositório fake em memória** (ver `docs/guia-testes.md`), verificando resultado e erros — **nunca** `toHaveBeenCalledWith`.

### Fase 4 — Infrastructure

```
src/modules/procedures/infrastructure/
├── entities/procedure.orm.ts
├── mappers/procedure.mapper.ts
└── repositories/procedure-typeorm.repository.ts
```

1. **Mover** `entities/procedure.entity.ts` → `infrastructure/entities/procedure.orm.ts` e **renomear a classe** para `ProcedureOrmEntity`. **Não altere** `@Entity('procedures')`, colunas, `name` das colunas, relações nem `RelationId`. O sufixo `.orm.ts` é obrigatório (glob do `database/data-source.ts`).
2. `mappers/procedure.mapper.ts` com `toDomain` (usa `Procedure.rehydrate`) e `toPersistence` (monta a `ProcedureOrmEntity`, `entity.user = { id: domain.userId }`).
3. `repositories/procedure-typeorm.repository.ts` implementa `IProcedureRepository` com `EntityManager`, sempre convertendo pelo mapper:
   - `findById`: `findOne(ProcedureOrmEntity, { where: { id, user: { id: userId } } })`.
   - `findAllByUser`: `findAndCount` com `where: { user: { id: userId } }`, `skip: options.page - 1`, `take: options.limit` (**preservando o desvio**). Retorna `{ items, totalCount }`.
   - `create`/`update`: `save`.
   - `remove`: hard `delete` (**preservando o desvio**).
4. `@Injectable()` é permitido nesta camada.

Só `infrastructure/` importa `ProcedureOrmEntity`.

### Fase 5 — Presentation

```
src/modules/procedures/presentation/http/
├── controllers/procedures.controller.ts
├── dtos/create-procedure.dto.ts
├── dtos/update-procedure.dto.ts
└── presenters/procedure.presenter.ts
```

1. **Mover** os DTOs (sem alterar validações) e ajustar os imports dos specs.
2. `ProcedurePresenter.toHttp(procedure)` emite as mesmas chaves hoje serializadas: `id`, `name`, `description`, `price`, `returnDays`, `durationMinutes`, `createdAt`, `updatedAt`.
3. Controller fino:
   - `POST`: resolve `userId` com `getLoggedInUserHelper()`, chama `CreateProcedureUseCase`, **não retorna corpo** (preserva 201 vazio).
   - `GET /`: chama `FindAllProceduresUseCase`, monta `new PaginatedResponseDto<...>(items.map(ProcedurePresenter.toHttp), { page, limit, totalCount })`.
   - `GET /:id`: chama `FindProcedureUseCase`; retorna `new ResponseDto(ProcedurePresenter.toHttp(procedure))`. **Não** tratar 404 no controller — o use case lança `NotFoundError` e o filtro global traduz.
   - `PATCH /:id`: chama `UpdateProcedureUseCase`; **não retorna corpo**.
   - `DELETE /:id`: chama `RemoveProcedureUseCase`; **não retorna corpo**.
   - Mantém `@Controller('procedures')`, `@ApiBearerAuth()`, `VerifyUUIDIdPipe`.
4. **Remover** `controllers/procedures.controller.spec.ts` (assere chamadas do service e detalhes de framework). O contrato HTTP já é coberto pelo e2e; comportamento dos use cases é coberto na fase 3.

### Fase 6 — Módulo (composition root)

`src/modules/procedures/procedures.module.ts`:

- `imports: [TypeOrmModule.forFeature([ProcedureOrmEntity])]`.
- `controllers: [ProceduresController]`.
- `providers`:
  - `{ provide: PROCEDURE_REPOSITORY, useClass: ProcedureTypeOrmRepository }`.
  - Cada use case com `useFactory`, injetando `PROCEDURE_REPOSITORY` (ver `docs/padrao-arquitetura.md` seção 6.4). Repos que precisam de outros use cases usam `inject` apropriado.
- `exports: [PROCEDURE_REPOSITORY]`.

### Fase 7 — Consumidores externos

Atualize as relações TypeORM que apontavam para a entidade movida:

- `src/modules/appointments/entities/appointment.entity.ts`: importar `ProcedureOrmEntity` de `@/modules/procedures/infrastructure/entities/procedure.orm` e usar `@ManyToOne(() => ProcedureOrmEntity, (procedure) => procedure.appointments, ...)`.
- `src/modules/users/entities/user.entity.ts`: importar `ProcedureOrmEntity` e usar `@OneToMany(() => ProcedureOrmEntity, (procedure) => procedure.user)`.

Isso é um **desvio temporário**: `appointments` e `users` ainda são legado e o TypeORM exige a classe na relação. Registre em `docs/guia-refatoracao.md` seção 5 („appointments/users importam `ProcedureOrmEntity` para a relação até serem migrados").

Se preferir evitar o import cruzado agora, a alternativa é manter um re-export temporário em `src/modules/procedures/entities/procedure.entity.ts`, mas isso fere a limpeza e deve ser removido. **Recomendação: atualizar os imports e registrar o desvio.**

### Fase 8 — Testes

1. **Remover** specs legados: `services/procedures.service.spec.ts` e `controllers/procedures.controller.spec.ts`.
2. **Manter/ajustar** `create-procedure.dto.spec.ts` e `update-procedure.dto.spec.ts` (novo caminho de import).
3. **Adicionar** specs de entidade, validator e use cases (fases 2 e 3).
4. **Ajustar o e2e** só se o caminho de fixtures/DTOs mudar. O comportamento esperado **não muda**: `test/e2e/src/modules/procedures/procedures.e2e-spec.ts` deve continuar passando sem alterar asserções.
5. Rode:
   ```bash
   pnpm run test
   pnpm run test:e2e
   ```

### Fase 9 — Limpeza

Remova as pastas legadas do módulo: `controllers/`, `services/`, `dto/`, `entities/`. Nada duplicado.

### Fase 10 — Verificação (quality gate)

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e
```

Não encerre com lint, typecheck, build ou testes falhando.

### Fase 11 — Atualizar documentação

- `docs/guia-refatoracao.md` seção 4: marcar `procedures` como **Migrado**.
- `docs/guia-refatoracao.md` seção 5: registrar o desvio dos imports de `ProcedureOrmEntity` em `appointments`/`users` e manter as correções pendentes (paginação, delete) como itens de MR separado.
- `docs/padrao-arquitetura.md`: `procedures` deixa de ser “após a migração” e passa a ser referência real.

### Fase 12 — Commit

Conventional Commits, assunto e corpo em português, header ≤ 72 caracteres. Sugestão de commits:

```
chore(common): adiciona erros de domínio e tratamento no filtro global
refactor(procedures): migra módulo para clean architecture
test(procedures): cobre entidade, validator e use cases
docs(procedures): atualiza guias de migração e arquitetura
```

---

## 5. Estrutura final esperada

```
src/modules/procedures/
├── procedures.module.ts
├── domain/
│   ├── entities/procedure.entity.ts (+ .spec.ts)
│   ├── types/procedure.type.ts
│   ├── validators/procedure.validator.ts (+ .spec.ts)
│   └── repositories/procedure.repository.ts
├── application/
│   └── usecases/
│       ├── create-procedure.usecase.ts (+ .spec.ts)
│       ├── find-all-procedures.usecase.ts (+ .spec.ts)
│       ├── find-procedure.usecase.ts (+ .spec.ts)
│       ├── update-procedure.usecase.ts (+ .spec.ts)
│       └── remove-procedure.usecase.ts (+ .spec.ts)
├── infrastructure/
│   ├── entities/procedure.orm.ts
│   ├── mappers/procedure.mapper.ts
│   └── repositories/procedure-typeorm.repository.ts
└── presentation/http/
    ├── controllers/procedures.controller.ts
    ├── dtos/create-procedure.dto.ts (+ .spec.ts)
    ├── dtos/update-procedure.dto.ts (+ .spec.ts)
    └── presenters/procedure.presenter.ts
```

---

## 6. Checklist final

- [ ] Fase 0: `DomainError`/`NotFoundError`, `PageOptions`/`PagedResult`, filtro global e chaves i18n.
- [ ] Baseline de testes (unit + e2e) verde antes de migrar.
- [ ] `domain/` puro (sem imports proibidos), com `create`/`rehydrate`/`changeDetails` e validator.
- [ ] Interface de repositório com token `PROCEDURE_REPOSITORY`.
- [ ] Use cases sem decorators, dependendo só de interface.
- [ ] `ProcedureOrmEntity` em `infrastructure/entities/procedure.orm.ts`, tabela/colunas idênticas.
- [ ] Mapper e repositório TypeORM (`EntityManager`), `soft`/hard delete conforme decisão.
- [ ] Presenter emitindo o contrato atual; controller fino; 404 via `NotFoundError`.
- [ ] `useFactory` no módulo; token exportado.
- [ ] Consumidores atualizados; desvio registrado nos guias.
- [ ] Pastas legadas removidas; nenhum spec acoplado à query/chamada.
- [ ] `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run test:e2e` verdes.
- [ ] Documentação atualizada.

```ts
export const EXCEPTION_PORT = Symbol('IException');

/**
 * Porta de exceção. O domínio/aplicação declara O QUE aconteceu;
 * a infraestrutura decide COMO isso vira resposta (HTTP, fila, CLI...).
 */
export interface IException {
  badRequest(message: string): never;
  notFound(message: string): never;
  conflict(message: string): never;
  internal(message: string): never;
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IException } from '@modules/linha-seccionamento/domain/ports/exception.port';

@Injectable()
export class ExceptionsService implements IException {
  badRequest(message: string): never {
    throw new BadRequestException(message);
  }
  notFound(message: string): never {
    throw new NotFoundException(message);
  }
  conflict(message: string): never {
    throw new ConflictException(message);
  }
  internal(message: string): never {
    throw new InternalServerErrorException(message);
  }
}
```
