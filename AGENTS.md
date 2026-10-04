# AGENTS.md — Diretrizes para Agentes de IA (api-sistema-manicure)

API do sistema de gestão de salão/manicure (NestJS 11 + TypeScript + TypeORM + PostgreSQL 18 + JWT em cookie). Cuida de usuários, clientes, procedimentos, horários de trabalho, folgas, agendamentos e notificações.

Este arquivo é o **ponto de entrada** para qualquer agente (Claude Code, OpenCode, agy): reúne as regras que valem sempre, o mapa da documentação em `docs/` e os comandos essenciais. **Antes de executar qualquer ação, leia o doc do tema correspondente.**

## Arquitetura em transição

O projeto está migrando para **Clean Architecture**. Hoje todos os módulos são legado (NestJS REST com `controllers/`, `services/`, `dto/`, `entities/`). O objetivo é refatorar os módulos antigos **um por vez**; **código novo nasce no padrão-alvo** (`docs/padrao-arquitetura.md`) e a migração segue `docs/guia-refatoracao.md`. O módulo **piloto/referência é `procedures`**. **CQRS não faz parte do padrão.**

## Mapa da documentação

| Tema                                                                                                | Arquivo                       | Leia quando                                |
| --------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------ |
| Stack, estrutura, convenções e ambiente                                                             | `README.md`                   | precisar da visão geral do projeto         |
| Clean Architecture: camadas, pastas, domain, use cases, infra, HTTP, banco, integrações, convenções | `docs/padrao-arquitetura.md`  | criar ou alterar qualquer código em `src/` |
| Migração de módulo legado, status por módulo e desvios conhecidos                                   | `docs/guia-refatoracao.md`    | refatorar ou tocar módulo legado           |
| Banco, migrations TypeORM, variáveis de ambiente                                                    | `docs/guia-banco-de-dados.md` | alterar schema, entidades ou conexão       |
| Testes unitários e E2E                                                                              | `docs/guia-testes.md`         | criar ou ajustar testes                    |
| Mensagens de commit                                                                                 | `docs/padrao-commits.md`      | preparar commit                            |

## Mapa das skills

Skills do projeto ficam em `.agents/skills/<nome>/SKILL.md` (lidas por OpenCode e agy).

| Skill                              | Use ao                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `api-sistema-manicure-code-review` | revisar código (git diff, branch, commit ou arquivos/módulo) sob Clean Architecture, padrões do projeto e SOLID, sem alterar o código |

A skill global `git-commit-convention` também se aplica; em caso de divergência, vale `docs/padrao-commits.md`.

## Estrutura

Módulos em `src/modules/<feature>/`. No legado, cada módulo contém `controllers/`, `services/`, `dto/`, `entities/`, `enums/`, `events/` e `configs/`; no padrão-alvo, passa a `domain/`, `application/`, `infrastructure/` e `presentation/http/`. Código transversal fica em `src/common/` (decorators, dtos, entities, enums, filters, helper, pipes, types). Módulos: `authentication`, `users`, `clients`, `procedures`, `schedule-templates`, `time-offs`, `appointments`, `notifications`, `notification-templates`, `i18n`, `database`, `app`.

## Regras absolutas

1. **Nunca adicionar comentários** em nenhum arquivo (TS, SQL, JSON, config), em nenhuma hipótese. Código autoexplicativo via nomes, tipagem e estrutura.
2. **Plano antes de implementar**: criar/editar arquivos ou rodar comandos que modificam o projeto (`lint --fix`, migrations, seeds, `git commit`...) exige análise prévia e **aprovação explícita**. Silêncio não é aprovação; se o escopo mudar, pare e apresente novo plano. Leitura/consulta não exige.
3. **Clean Architecture em código novo**: `domain/` puro (sem `@nestjs`, `typeorm`, `class-validator`, `nestjs-cls`), entidade de domínio separada da `OrmEntity`, use case como classe comum com `execute` dependendo de `I<Entidade>Repository` via token, controller e handler finos. Use case **sem `@Injectable()`/`@Inject()`** — registre-o com `useFactory` no módulo. `@InjectRepository`, `Repository<T>` e `EntityManager` só em `infrastructure/`.
4. **Sem CQRS**: nunca `@nestjs/cqrs` (`CommandBus`, `QueryBus`, `EventBus`, handlers, pastas `commands/`/`queries/`). Controllers e handlers de evento chamam os use cases diretamente.
5. **Legado**: funcionalidade nova em módulo legado já nasce no padrão-alvo; correção pontual pode seguir o padrão existente, sem criar acoplamentos novos. Refatoração de módulo segue `docs/guia-refatoracao.md` e só começa com plano aprovado.
6. **Schema do banco só por migration** (`synchronize: false`) em `database/migrations/`, com `down` reversível. Sempre revise o `up` e o `down` gerados. Commite a migration junto da alteração das entities.
7. **Autenticação global**: `JwtAuthGuard` é registrado como `APP_GUARD`. Rotas abertas usam `@Public()`; o restante já exige JWT (cookie `access_token`). Nunca desabilite o guard global.
8. **Escopo por usuário**: a presentation resolve o usuário com `getLoggedInUserHelper()` (CLS) e passa o `userId` ao use case; o repositório filtra por `user.id`. Nunca confie em `userId` vindo do cliente nem leia CLS no domain.
9. **Contratos HTTP preservados**: rotas, verbos, status codes e formatos de resposta (`ResponseDto<T>`, `PaginatedResponseDto<T>`) só mudam alinhados com o frontend (`sistema-manicure-web`).
10. **Entrada validada** por DTO com `class-validator`/`class-transformer` e `I18nValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`). Parâmetro de rota UUID usa `VerifyUUIDIdPipe`.
11. **Mensagens de erro i18n**: nunca hardcode texto de erro. Use chaves de `src/modules/i18n/languages/pt-BR/` (`validation.*`, `exception.*`). No `domain`/`application`, lance `DomainError`/`NotFoundError` (framework-free); exceções HTTP do Nest só na presentation. `src/generated/` é gerado — nunca editar à mão.
12. **Imports com alias** (`@/*`, `@src/*`, `@test/*`, `@test/e2e/*`); sem caminho relativo entre módulos.
13. **Sem strings mágicas**: status, tipos e nomes de evento em enums/constantes (`StatusAppointmentEnum`, `AppointmentEventEnum`...). Procure antes de criar.
14. **Entidades ORM** estendem `BaseEntity` (uuid, `createdAt`, `updatedAt`, `deletedAt`), com nomes de coluna em `snake_case` e remoção por soft delete. Só a `infrastructure/` importa `OrmEntity`, que fica em `infrastructure/entities/<entidade>.orm.ts`.
15. **Eventos de domínio** via `EventEmitter2` (`emitAsync` + `@OnEvent`), com payloads em classes nomeadas; handlers apenas orquestram use cases.
16. **Idioma**: identificadores de código (classes, arquivos, métodos, variáveis) em inglês, seguindo o padrão do projeto (`Procedure`, `CreateProcedureUseCase`); textos ao usuário via i18n em pt-BR; documentação em português.
17. **Nunca versionar segredos**: não exponha credenciais de `.env*` em código, logs ou commits.
18. **Não encerrar tarefas** com lint, typecheck, build ou testes falhando.

## Comandos essenciais

```bash
pnpm install
pnpm run start:dev                 # API em watch mode
pnpm run docker:up                 # Postgres + API via compose
pnpm run lint                      # eslint --fix
pnpm run typecheck                 # tsc --noEmit (src + spec)
pnpm run test                      # testes unitários
pnpm run test:e2e                  # testes E2E
pnpm run build                     # nest build
pnpm migration:generate            # gera migration a partir das entities
pnpm migration:run                 # aplica migrations
pnpm migration:show                # status das migrations
pnpm seed:user                     # cria usuário de seed
```

O TypeORM CLI lê variáveis `DATABASE_*_EXTERNAL` (host); a API no Docker usa `DATABASE_HOST`/`DATABASE_PORT`. Detalhes em `docs/guia-banco-de-dados.md`.

## Testes

- Unitários (`src/**/*.spec.ts`) colocados ao lado do arquivo testado.
- E2E em `test/e2e/src/modules/<feature>/`, espelhando `src/modules/`, com fixtures e helpers próprios; sobem schema `DATABASE_E2E_SCHEMA`. Use `createE2eApp()` e o helper de autenticação.
- Toda feature nova ou corrigida deve vir com teste; ajuste o spec existente quando a mudança alterar comportamento.

## Quality gate

Antes de concluir qualquer tarefa:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

Se a mudança tocar fluxo coberto por E2E, banco ou autenticação, rode também `pnpm run test:e2e` (Postgres no ar).

## Commits

Conventional Commits com **assunto e corpo em português** (tipo e escopo em inglês). Header completo com **no máximo 72 caracteres**; detalhes no corpo. Hooks: `commit-msg` (commitlint) e `pre-commit` (lint-staged). Escopos comuns: `appointments`, `auth`, `clients`, `common`, `config`, `docker`, `docs`, `i18n`, `notifications`, `procedures`, `schedule-templates`, `time-offs`, `users`. Guia completo em `docs/padrao-commits.md`.
