# Guia de Refatoração para Clean Architecture

O objetivo é migrar os módulos de `src/modules/` para o padrão de `docs/padrao-arquitetura.md`. A migração é **incremental, um módulo por vez, sem mudança de comportamento**. O módulo piloto é `procedures`.

---

## 1. Princípios

1. **Um módulo por entrega**, em branch e merge request próprios (`refatora-<modulo>`).
2. **Comportamento idêntico**: refatoração não muda regra de negócio. Correções encontradas no caminho vão em commit ou MR separado.
3. **Contratos preservados**:
   - HTTP: rotas, verbos, status codes e corpo de resposta (`ResponseDto`/`PaginatedResponseDto`).
   - Eventos: nomes (`AppointmentEventEnum`) e formato dos payloads.
   - Banco: tabela e colunas da `OrmEntity` iguais; sem migration, salvo se inevitável.
4. **Testes antes**: garanta cobertura do comportamento atual antes de mover código.
5. **Plano aprovado**: a refatoração só começa com plano apresentado e aprovado.

## 2. Diagnóstico do Módulo

Antes do plano, levante:

- Entidades TypeORM do módulo e quem as importa fora dele (`grep -rn "modules/<modulo>/entities" src`).
- Services e o que cada um faz; cada caso de uso vira um `UseCase`.
- Rotas expostas no controller, com verbos, status e formato de resposta.
- Enums, eventos, guards, pipes e validators com regra de negócio.
- Consumidores de evento (`@OnEvent`) e emissores (`eventEmitter.emitAsync`).
- Testes existentes (unitários e e2e).

## 3. Passo a Passo

1. **Testes de caracterização**: e2e em `test/e2e/src/modules/<modulo>/` cobrindo as operações principais, ou unitários dos services. Rode e confirme que passam.
2. **Domain**:
   - `domain/types/<entidade>.type.ts` com `<Entidade>Props`.
   - `domain/entities/<entidade>.entity.ts` com `create`, `rehydrate` e métodos de negócio.
   - `domain/validators/<entidade>.validator.ts` com as invariantes.
   - `domain/repositories/<entidade>.repository.ts` com interface e token.
   - Regras puras para `domain/services/`, com teste.
   - Eventos de negócio em `domain/events/`, se houver.
3. **Infrastructure**:
   - Mova `entities/<entidade>.entity.ts` para `infrastructure/entities/<entidade>.orm.ts` e renomeie a classe para `<Entidade>OrmEntity`. Não altere `@Entity`, colunas e relações.
   - Crie o mapper e o repositório TypeORM (`softDelete` na remoção).
   - Portas e adapters para serviços externos usados pelo módulo.
4. **Application**: cada operação de service vira `usecases/<acao>-<entidade>.usecase.ts`, dependendo só das interfaces. Use case é classe comum, sem `@Injectable()`/`@Inject()` nem imports de framework; o wiring vai no módulo (passo 6). Erros de negócio viram `DomainError`, não exceções HTTP. Handlers de evento em `application/handlers/` apenas orquestram use cases.
5. **Presentation**: controller em `presentation/http/controllers`, DTOs em `dtos/`, presenter em `presenters/`. Mantenha rotas, status e corpo de resposta.
6. **Módulo**: registre cada use case com `useFactory` (sem `@Injectable()`, injetando os tokens que ele precisa) e o provider `{ provide: <ENTIDADE>_REPOSITORY, useClass: ... }`; exporte o token.
7. **Consumidores externos**: atualize os módulos que importavam a entidade ou service legado para usar o token ou um use case exportado. Se o consumidor também for legado e a troca for grande, registre como desvio na seção 5.
8. **Testes**: atualize fixtures/factories para a `OrmEntity`; adicione testes unitários de entidade, validator e use cases (repositório mockado). Ajuste o e2e existente.
9. **Limpeza**: remova as pastas legadas (`controllers/`, `services/`, `dto/`, `entities/`, `events/`...) do módulo. Nada duplicado.
10. **Verificação**: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` e, no módulo afetado, `pnpm run test:e2e` com Postgres no ar.
11. **Status**: atualize a tabela da seção 4.

## 4. Status da Migração

| Módulo                   | Situação          |
| ------------------------ | ----------------- |
| `procedures`             | Piloto (a migrar) |
| `appointments`           | Legado            |
| `authentication`         | Legado            |
| `clients`                | Legado            |
| `notification-templates` | Legado            |
| `notifications`          | Legado            |
| `schedule-templates`     | Legado            |
| `time-offs`              | Legado            |
| `users`                  | Legado            |

Módulos transversais/infraestrutura (`common`, `i18n`, `database`, `app`) não entram na migração por módulo; seguem as mesmas convenções ao serem tocados.

`procedure` é um bom piloto: pouca regra, um relacionamento e poucos consumidores. Depois dele, módulos simples como `time-offs` e `schedule-templates`.

## 5. Desvios Conhecidos

### `procedures` (piloto)

- `ProceduresService.findAll` usa `skip: page - 1` em vez de `(page - 1) * limit` (paginação incorreta).
- `ProceduresService.remove` faz hard delete (`repository.delete`) em vez de soft delete.
- `ProceduresController.create` e `update` não retornam corpo; `findAll` expõe a `ProcedureEntity` crua.
- Esses pontos são **correções de comportamento**: vão em MR separado, não na refatoração.

### `appointments`

- `AppointmentsService` importa `TimeOffEntity` e `ProcedureEntity` de outros módulos e injeta os repositórios diretamente (acoplamento entre módulos; no padrão-alvo só por token/use case).
- `AppointmentsController.create` e `update` não retornam corpo.

### `notifications`

- `NotificationsService` importa `AppointmentEntity` e os eventos de `appointments` diretamente.
- Serviço faz `onModuleInit` com log e concentra regra de agendamento de notificações, candidata a use case.

### `authentication`

- `sign-up` está comentado no controller; `AuthenticationService` e `UsersService` acessam repositório direto.
- O `JwtAuthGuard` é global (`APP_GUARD`); qualquer novo módulo herda a proteção e usa `@Public()` apenas quando necessário.

## 6. Ao Tocar Código Legado Sem Refatorar

- **Funcionalidade nova**: já no padrão-alvo (use case + repositório por interface), mesmo com o resto do módulo legado.
- **Correção pontual**: pode seguir o padrão existente para não inflar o escopo, sem criar acoplamentos novos (novo `@InjectRepository` de entidade de outro módulo, regra de negócio em controller ou handler de evento).
