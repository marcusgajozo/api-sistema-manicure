# API Sistema Manicure

API REST do sistema de gestão de salão/manicure. Cuida de usuários, clientes, procedimentos, horários de trabalho, folgas, agendamentos e notificações, com autenticação por JWT.

## Stack

- **NestJS 11** + **TypeScript**
- **TypeORM 0.3** + **PostgreSQL 18**
- **Autenticação** com `passport-jwt`, token em cookie `httpOnly`
- **nestjs-i18n** (pt-BR) para mensagens de validação e erro
- **Swagger** para documentação da API
- **EventEmitter2** para eventos de domínio e **nestjs-cls** para contexto da requisição
- **pnpm** + **Node 24** + **Docker**

## Arquitetura em transição

O projeto está migrando para **Clean Architecture**, um módulo por vez. Código novo nasce no padrão-alvo. O módulo piloto é `procedures`.

- Padrão-alvo: [`docs/padrao-arquitetura.md`](docs/padrao-arquitetura.md)
- Migração de módulos legados: [`docs/guia-refatoracao.md`](docs/guia-refatoracao.md)

## Documentação

| Tema                                      | Arquivo                                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| Arquitetura e convenções de código        | [`docs/padrao-arquitetura.md`](docs/padrao-arquitetura.md)   |
| Migração para Clean Architecture          | [`docs/guia-refatoracao.md`](docs/guia-refatoracao.md)       |
| Banco, migrations e variáveis de ambiente | [`docs/guia-banco-de-dados.md`](docs/guia-banco-de-dados.md) |
| Testes unitários e E2E                    | [`docs/guia-testes.md`](docs/guia-testes.md)                 |
| Mensagens de commit                       | [`docs/padrao-commits.md`](docs/padrao-commits.md)           |

## Requisitos

- Node 24 (ver `.nvmrc` / `engines` no `package.json`)
- pnpm (`corepack enable pnpm`)
- Docker e Docker Compose

## Começando

```bash
cp .env.example .env      # ajuste as variáveis se necessário
pnpm install
pnpm run docker:up        # sobe Postgres + API em modo watch
pnpm migration:run        # aplica as migrations (roda no host)
pnpm seed:user            # cria o usuário de seed
```

A API fica em `http://localhost:3000` e o Swagger em `http://localhost:3000/swagger`.

Credenciais do seed (padrão de `.env.example`): `admin@example.com` / `password123`.

Para subir apenas o banco:

```bash
docker compose -f docker-compose.local.yaml up postgres-sistema-manicure-db -d
```

## Scripts

| Comando                   | Descrição                               |
| ------------------------- | --------------------------------------- |
| `pnpm run start`          | Sobe a API                              |
| `pnpm run start:dev`      | Sobe a API em watch mode                |
| `pnpm run start:prod`     | Sobe a API com o build de produção      |
| `pnpm run build`          | Compila o projeto                       |
| `pnpm run lint`           | Roda o ESLint com `--fix`               |
| `pnpm run lint:fix`       | ESLint + Prettier                       |
| `pnpm run typecheck`      | Checagem de tipos (src + spec)          |
| `pnpm run fix`            | `lint:fix` + `typecheck`                |
| `pnpm run check`          | `fix` + testes                          |
| `pnpm run test`           | Testes unitários                        |
| `pnpm run test:e2e`       | Testes end-to-end                       |
| `pnpm run test:cov`       | Testes com cobertura                    |
| `pnpm run docker:up`      | Sobe Postgres + API via Docker Compose  |
| `pnpm run docker:down`    | Derruba os serviços do Docker Compose   |
| `pnpm migration:generate` | Gera migration a partir das entidades   |
| `pnpm migration:run`      | Aplica migrations pendentes             |
| `pnpm migration:revert`   | Desfaz a última migration               |
| `pnpm migration:show`     | Mostra o status das migrations          |
| `pnpm seed:user`          | Cria o usuário de seed                  |
| `pnpm run commit`         | Commit guiado (Commitizen + commitlint) |

## Banco de dados

O schema evolui apenas por migrations em `database/migrations/` (`synchronize: false`). O CLI do TypeORM usa as variáveis `DATABASE_*_EXTERNAL` (acesso pelo host); a API no Docker usa `DATABASE_HOST`/`DATABASE_PORT`. Detalhes em [`docs/guia-banco-de-dados.md`](docs/guia-banco-de-dados.md).

## Testes

- **Unitários**: `src/**/*.spec.ts`, ao lado do arquivo testado — `pnpm run test`.
- **E2E**: `test/e2e/src/modules/<feature>/`, espelhando `src/modules/` e usando o schema `DATABASE_E2E_SCHEMA` — `pnpm run test:e2e`.

Mais detalhes em [`docs/guia-testes.md`](docs/guia-testes.md).

## Estrutura do projeto

```
src/
├── common/            # código transversal (dtos, decorators, filters, helpers, pipes)
├── modules/           # features (appointments, clients, procedures, users, ...)
├── generated/         # tipos gerados do i18n (não editar)
└── main.ts
database/              # CLI do TypeORM: data-source, migrations e seeds
test/                  # testes E2E
docs/                  # documentação do projeto
```

## Autenticação

O `JwtAuthGuard` é global (`APP_GUARD`): todas as rotas exigem o cookie `access_token`, exceto as marcadas com `@Public()`. O login é feito em `POST /authentication/sign-in`, que grava o token em cookie.

## CI/CD

Push na branch `prd` dispara o pipeline ([`.github/workflows/ci-cd.yaml`](.github/workflows/ci-cd.yaml)): build e push da imagem para o GitHub Container Registry, execução das migrations e acionamento do webhook do Portainer.

## Licença

[Apache 2.0](LICENSE).
