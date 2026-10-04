# Padrão Arquitetural e Estrutura do Projeto (api-sistema-manicure)

Este documento define a arquitetura-alvo da API. O projeto está em transição: **nenhum módulo segue Clean Architecture ainda**; todos são legado e serão migrados aos poucos (ver `docs/guia-refatoracao.md`). O **módulo piloto é `procedures`**. **Todo código novo nasce no padrão descrito aqui.**

---

## 1. Visão Geral e Referências

| Situação              | Onde olhar                                                             |
| --------------------- | ---------------------------------------------------------------------- |
| Módulo piloto         | `src/modules/procedures` (após a migração)                             |
| Legado (não copiar)   | demais módulos, ex.: `src/modules/appointments`                        |
| Paginação e respostas | `src/common/dtos/pagination.dto.ts`, `src/common/dtos/response.dto.ts` |
| Usuário logado        | `src/common/helper/get-logged-in-user.helper.ts`                       |
| Erros e i18n          | `src/common/filters/global-exception.filter.ts`                        |

Enquanto `procedures` não estiver migrado, use **este documento** como referência abstrata.

**CQRS não faz parte do padrão.** Controllers e handlers chamam os use cases diretamente (`docs/guia-refatoracao.md`).

## 2. Camadas e Regra de Dependência

```
presentation  ──►  application  ──►  domain  ◄──  infrastructure
```

- **domain**: regras de negócio puras. Não conhece nenhuma outra camada.
- **application**: casos de uso e orquestração. Conhece só o `domain`.
- **infrastructure**: implementa as interfaces do `domain` (banco, serviços externos).
- **presentation**: entradas HTTP. Converte a entrada, chama o use case e formata a saída.
- O `<modulo>.module.ts` é o único lugar que liga interface e implementação.

## 3. Estrutura de Pastas do Módulo

```
src/modules/<modulo>/
├── <modulo>.module.ts
├── domain/
│   ├── entities/        <entidade>.entity.ts
│   ├── types/           <entidade>.type.ts
│   ├── repositories/    <entidade>.repository.ts
│   ├── validators/      <entidade>.validator.ts
│   ├── services/        <regra>.ts (+ .spec.ts)
│   ├── events/          <evento>.event.ts
│   ├── ports/           <servico-externo>.port.ts
│   └── enums/
├── application/
│   ├── usecases/        <acao>-<entidade>.usecase.ts
│   ├── mappers/         <origem>-to-<destino>.mapper.ts
│   └── handlers/        <evento>.handler.ts
├── infrastructure/
│   ├── entities/        <entidade>.orm.ts
│   ├── repositories/    <entidade>-typeorm.repository.ts
│   ├── mappers/         <entidade>.mapper.ts
│   └── adapters/        <servico-externo>.adapter.ts
└── presentation/
    └── http/
        ├── controllers/ <rota>.controller.ts
        ├── dtos/        <acao>-<entidade>.dto.ts
        └── presenters/  <entidade>.presenter.ts
```

Crie só as pastas necessárias. Nomes de arquivo em kebab-case com sufixo do papel (`.entity`, `.orm`, `.usecase`, `.repository`, `.mapper`, `.presenter`, `.dto`, `.port`, `.adapter`, `.handler`).

**Sufixo da OrmEntity**: a entidade TypeORM fica em `infrastructure/entities/<entidade>.orm.ts` (sufixo `.orm.ts`). O `database/data-source.ts` descobre as entidades por dois globs — `src/modules/**/*.entity.{ts,js}` (entidades legadas) e `src/modules/**/*.orm.{ts,js}` (OrmEntity nova) — então não use outro sufixo.

## 4. Domain

### 4.1. Entidade

Classe TypeScript pura, sem decorators e sem depender de TypeORM. Valida as invariantes no construtor e expõe `create` (nova) e `rehydrate` (vinda do banco).

```ts
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

  static create(props: Omit<ProcedureProps, 'id' | 'createdAt'>): Procedure {
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

  changeDetails(
    props: Partial<
      Pick<
        ProcedureProps,
        'name' | 'description' | 'price' | 'returnDays' | 'durationMinutes'
      >
    >,
  ): void {
    Object.assign(this, props);
    this.updatedAt = new Date();
    ProcedureValidator.validate(this);
  }
}
```

- Regras de mudança de estado são métodos da entidade (`changeDetails`, `cancel`, `reschedule`), não código espalhado em use cases.
- `<Entidade>Props` fica em `domain/types/<entidade>.type.ts`.

### 4.2. Validator

Valida invariantes da entidade. O domínio lança **erros de domínio próprios**, nunca exceções do Nest: use `DomainError` (ver seção 9) com chave i18n e argumentos, nunca texto fixo.

```ts
import { DomainError } from '@/common/errors/domain.error';

export class ProcedureValidator {
  static validate(procedure: Procedure): void {
    if (!procedure.name || procedure.name.trim().length === 0) {
      throw new DomainError('validation.PROCEDURE_NAME_REQUIRED');
    }
    if (procedure.price < 0) {
      throw new DomainError('validation.PROCEDURE_PRICE_INVALID');
    }
  }
}
```

### 4.3. Interface do Repositório

```ts
export const PROCEDURE_REPOSITORY = Symbol('PROCEDURE_REPOSITORY');

export interface IProcedureRepository {
  findById(id: string, userId: string): Promise<Procedure | null>;
  findAllByUser(
    userId: string,
    options: PageOptions,
  ): Promise<PagedResult<Procedure>>;
  create(procedure: Procedure): Promise<Procedure>;
  update(procedure: Procedure): Promise<Procedure>;
  softDelete(id: string, userId: string): Promise<void>;
}
```

Consultas específicas (relatórios, filtros complexos) viram métodos com nome de negócio na interface (`findAllByUser`, `findActiveByUser`), nunca SQL ou `QueryBuilder` fora da infraestrutura.

### 4.4. Serviços de Domínio, Eventos e Portas

- Regra pura que não pertence a uma entidade só vira arquivo em `domain/services/`, sem I/O e com teste unitário.
- Fato de negócio relevante vira classe em `domain/events/<evento>.event.ts` (enums de nome de evento junto). Quem reage fica em `application/handlers/`.
- Serviço externo (HTTP, e-mail, armazenamento) é declarado como interface + token em `domain/ports/` e implementado em `infrastructure/adapters/`.

### 4.5. Proibido no domain

Nenhum import de `@nestjs/*`, `typeorm`, `@nestjs/typeorm`, `class-validator`, `class-transformer`, `nestjs-cls`, `rxjs` ou de qualquer outra camada. Erros são `DomainError` (seção 9), não exceções HTTP. O domain **não** resolve o usuário logado: ele recebe `userId` pronto.

## 5. Application

### 5.1. Use Case

Um caso de uso por classe, método público único `execute`, recebe e devolve tipos de domínio. É uma **classe comum, sem decorators e sem imports de framework**: a injeção de dependência é feita no módulo (composition root), via `useFactory` (seção 6.4).

```ts
export class CreateProcedureUseCase {
  constructor(private readonly procedureRepository: IProcedureRepository) {}

  async execute(props: CreateProcedureProps): Promise<Procedure> {
    const procedure = Procedure.create(props);
    return this.procedureRepository.create(procedure);
  }
}
```

- Nome: `<Acao><Entidade>UseCase` (`CreateProcedureUseCase`, `FindAllProceduresUseCase`).
- Depende só de interfaces (repositórios e portas) e de outros use cases.
- **Sem `@Injectable()` e sem `@Inject()`**: não importa `@nestjs/*`, `typeorm` nem `class-validator`. O wiring fica no módulo.
- Não conhece HTTP, DTO de transporte nem `@InjectRepository`.
- O `userId` do usuário logado chega como parâmetro vindo da presentation (seção 7); nunca é lido de `req`/Cls aqui.
- Erros de negócio: `DomainError` (seção 9); a presentation e o filtro global traduzem para HTTP.

### 5.2. Handlers de eventos

Reagem a fatos de domínio com `@OnEvent` e **chamam use cases** (não contêm regra de negócio própria). O handler é a borda de entrada de eventos (adapter), então pode usar decorators do framework; os use cases que ele chama permanecem puros.

```ts
@Injectable()
export class AppointmentCreatedHandler {
  constructor(
    private readonly scheduleFollowUpUseCase: ScheduleFollowUpUseCase,
  ) {}

  @OnEvent(AppointmentEventEnum.CREATED)
  async handle(event: AppointmentCreatedEvent): Promise<void> {
    await this.scheduleFollowUpUseCase.execute(
      event.appointmentId,
      event.appointmentDate,
    );
  }
}
```

### 5.3. Sem CQRS

Não usar `@nestjs/cqrs` (`CommandBus`, `QueryBus`, `EventBus`, `@CommandHandler`, `@QueryHandler`, pastas `commands/` e `queries/`). O projeto não possui essa dependência e não deve passar a ter.

## 6. Infrastructure

### 6.1. Entidade ORM

Classe `@Entity` com sufixo `OrmEntity` em `infrastructure/entities/<entidade>.orm.ts`, estendendo `BaseEntity` (`src/common/entities/base.entity.ts`). Mantém nome de tabela e colunas existentes. Só a infraestrutura importa essa classe.

```ts
@Entity('procedures')
export class ProcedureOrmEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  name: string;
  // ... demais colunas e relações, sem alterar nomes
}
```

### 6.2. Mapper

```ts
export class ProcedureMapper {
  static toDomain(entity: ProcedureOrmEntity): Procedure {
    return Procedure.rehydrate({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      returnDays: entity.returnDays,
      durationMinutes: entity.durationMinutes,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: Procedure): ProcedureOrmEntity {
    const entity = new ProcedureOrmEntity();
    entity.id = domain.id || undefined;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.price = domain.price;
    entity.returnDays = domain.returnDays;
    entity.durationMinutes = domain.durationMinutes;
    entity.user = { id: domain.userId } as UserOrmEntity;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
```

### 6.3. Repositório TypeORM

`implements I<Entidade>Repository`, recebe `EntityManager`, converte sempre pelo mapper. Remoção é `softDelete`.

```ts
@Injectable()
export class ProcedureTypeOrmRepository implements IProcedureRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async findById(id: string, userId: string): Promise<Procedure | null> {
    const entity = await this.entityManager.findOne(ProcedureOrmEntity, {
      where: { id, user: { id: userId } },
    });
    return entity ? ProcedureMapper.toDomain(entity) : null;
  }
  // ...
}
```

### 6.4. Ligação no Módulo

Como os use cases não têm `@Injectable()`, registre cada um com `useFactory`, injetando os tokens que ele precisa. O repositório (infrastructure) pode usar `@Injectable()` normalmente.

```ts
@Module({
  imports: [TypeOrmModule.forFeature([ProcedureOrmEntity])],
  controllers: [ProceduresController],
  providers: [
    { provide: PROCEDURE_REPOSITORY, useClass: ProcedureTypeOrmRepository },
    {
      provide: CreateProcedureUseCase,
      useFactory: (repo: IProcedureRepository) =>
        new CreateProcedureUseCase(repo),
      inject: [PROCEDURE_REPOSITORY],
    },
    {
      provide: FindAllProceduresUseCase,
      useFactory: (repo: IProcedureRepository) =>
        new FindAllProceduresUseCase(repo),
      inject: [PROCEDURE_REPOSITORY],
    },
    {
      provide: FindProcedureUseCase,
      useFactory: (repo: IProcedureRepository) =>
        new FindProcedureUseCase(repo),
      inject: [PROCEDURE_REPOSITORY],
    },
    {
      provide: UpdateProcedureUseCase,
      useFactory: (repo: IProcedureRepository) =>
        new UpdateProcedureUseCase(repo),
      inject: [PROCEDURE_REPOSITORY],
    },
    {
      provide: RemoveProcedureUseCase,
      useFactory: (repo: IProcedureRepository) =>
        new RemoveProcedureUseCase(repo),
      inject: [PROCEDURE_REPOSITORY],
    },
  ],
  exports: [PROCEDURE_REPOSITORY],
})
export class ProceduresModule {}
```

## 7. Presentation (HTTP)

- Controller fino: recebe a requisição, resolve o usuário logado, chama o use case e monta a resposta. Nenhuma regra de negócio, nenhum repositório.
- Resolve o `userId` com `getLoggedInUserHelper()` e passa ao use case; não confia em `userId` do corpo.
- Entrada por DTO em `presentation/http/dtos/`, validada com `class-validator` (`I18nValidationPipe` global com `whitelist`, `forbidNonWhitelisted`, `transform`). Parâmetro de rota UUID usa `VerifyUUIDIdPipe`.
- Saída por `presenter` (`<Entidade>Presenter.toHttp`), `ResponseDto<T>` ou `PaginatedResponseDto<T>`. O controller nunca devolve a entidade de domínio nem a OrmEntity crua.
- **Contratos preservados**: rotas, verbos, status codes e corpo de resposta não mudam sem alinhar com o frontend `sistema-manicure-web`.

```ts
@ApiBearerAuth()
@Controller('procedures')
export class ProceduresController {
  constructor(
    private readonly createProcedure: CreateProcedureUseCase,
    private readonly findAllProcedures: FindAllProceduresUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProcedureDto) {
    const user = getLoggedInUserHelper();
    const procedure = await this.createProcedure.execute({
      ...dto,
      userId: user?.userId ?? '',
    });
    return new ResponseDto(ProcedurePresenter.toHttp(procedure));
  }
}
```

- `@Public()` apenas em rotas realmente abertas; o `JwtAuthGuard` global continua valendo para o resto.

## 8. Banco de Dados

- `synchronize: false`. Toda mudança de schema exige migration em `database/migrations/`, gerada por `pnpm migration:generate` e revisada.
- Migration com `up` e `down` reversíveis. Nunca editar migration já aplicada; corrija com uma nova.
- `database/data-source.ts` (CLI) e `src/modules/database/` (API) continuam separados; sem imports cruzados.
- Dados iniciais em `database/seeds/`. O `GlobalExceptionFilter` traduz erros do Postgres — não duplique esse tratamento.

## 9. i18n, Erros e Usuário Logado

- Mensagens de erro e validação nunca são hardcoded: use chaves de `src/modules/i18n/languages/pt-BR/` (`validation.*`, `exception.*`). `src/generated/` é gerado — nunca editar à mão.
- **Erros de domínio/aplicação são framework-free**: `domain` e `application` lançam `DomainError` (e `NotFoundError`, subclasse) de `src/common/errors/domain.error.ts` — classes puras que carregam a chave i18n e os argumentos, sem `@nestjs/*`.

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

- A tradução para HTTP é da camada externa: o `GlobalExceptionFilter` mapeia `NotFoundError` → 404 e `DomainError` → 400, e traduz a chave com i18n. Exceções HTTP do Nest (`BadRequestException`, `NotFoundException`) continuam válidas **na presentation**, nunca no domain/application.
- O escopo por usuário é responsabilidade da aplicação: a presentation obtém o `userId` com `getLoggedInUserHelper()` e passa ao use case, que repassa ao repositório. O domain desconhece `nestjs-cls`.

## 10. Comunicação entre Módulos

- Importe o módulo e injete o token exportado (`<ENTIDADE>_REPOSITORY`) ou um use case exportado.
- Nunca importe `OrmEntity` ou entidade TypeORM legada de outro módulo em código novo; use o token ou o use case.

## 11. Integrações Externas

- Todo serviço externo (HTTP, e-mail, armazenamento) é declarado como porta em `domain/ports/` e implementado em `infrastructure/adapters/`; o módulo liga via token.
- Nunca chamar `HttpService`/`axios` de outro módulo.

## 12. Convenções

### 12.1. Idioma

- Identificadores de código (classes, arquivos, métodos, variáveis) em **inglês**, seguindo o padrão atual do projeto (`Procedure`, `CreateProcedureUseCase`, `findAllByUser`).
- Textos exibidos ao usuário via i18n em **pt-BR**.
- Documentação em **português**.

### 12.2. Constantes e Enums

- Sem strings mágicas de domínio: status, tipos e nomes de evento em enums/constantes. Procure antes de criar (`domain/enums/` do módulo ou `src/common/enums/`).

### 12.3. Imports

- Sempre com alias (`@/*`, `@src/*`, `@test/*`, `@test/e2e/*`); sem caminho relativo entre módulos.

### 12.4. Código Limpo

- Nenhum comentário em nenhum arquivo.
- Sem código morto ou comentado.
- `any` só quando a tipagem da lib obriga.

## 13. Quality Gate

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

Mudança em fluxo coberto por e2e, banco ou autenticação: rode também `pnpm run test:e2e`.
