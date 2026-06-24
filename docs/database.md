# Database

Guia de conexão Postgres, migrations TypeORM e variáveis de ambiente.

## Visão geral

- **API (NestJS)**: conecta via `src/modules/database/`, lê `.env` com variáveis da rede Docker.
- **CLI (TypeORM)**: conecta via `database/`, lê `.env` com variáveis `_EXTERNAL` para acesso pelo host.
- **Schema**: evolui só por migrations em `database/migrations/`. A API usa `synchronize: false`.

## Separação de contexto

| Pasta                   | Responsabilidade                                       |
| ----------------------- | ------------------------------------------------------ |
| `database/`             | CLI TypeORM: `data-source`, config do host, migrations |
| `src/modules/database/` | NestJS: conexão da API via `ConfigModule`              |

Não há imports cruzados entre `database/` e `src/`. Migrations rodam com `pnpm migration:*`, não pelo módulo Nest.

O `data-source.ts` referencia entities em `src/` apenas por **glob de arquivos** para o CLI comparar schema ao gerar migrations — sem importar código de `src/`.

## Estrutura

```
database/
├── data-source.ts          # DataSource do TypeORM CLI
├── database.config.ts      # conexão migration (variáveis _EXTERNAL)
├── load-env.ts             # carrega .env para o CLI
└── migrations/
    └── *-InitialSchema.ts  # migrations versionadas

src/modules/database/
├── database.module.ts
└── configs/
    └── database.config.ts  # conexão app (variáveis Docker)
```

## Variáveis de ambiente

Copie `.env.example` para `.env`. Credenciais e nome do banco são compartilhados; host e porta mudam conforme o contexto.

| Variável                 | Uso                           | Exemplo                |
| ------------------------ | ----------------------------- | ---------------------- |
| `DATABASE`               | driver                        | `postgres`             |
| `DATABASE_NAME`          | nome do banco                 | `manicure_db`          |
| `DATABASE_USER`          | usuário                       | `postgres`             |
| `DATABASE_PASSWORD`      | senha                         | `postgres`             |
| `DATABASE_HOST`          | API no Docker                 | `postgres-manicure-db` |
| `DATABASE_PORT`          | API no Docker (porta interna) | `5432`                 |
| `DATABASE_HOST_EXTERNAL` | CLI no host                   | `localhost`            |
| `DATABASE_PORT_EXTERNAL` | CLI no host (porta mapeada)   | `5432`                 |

### Qual config usa cada contexto

| Contexto            | Arquivo de config                                 | Variáveis de host/porta                            |
| ------------------- | ------------------------------------------------- | -------------------------------------------------- |
| API no Docker       | `src/modules/database/configs/database.config.ts` | `DATABASE_HOST`, `DATABASE_PORT`                   |
| CLI na máquina host | `database/database.config.ts`                     | `DATABASE_HOST_EXTERNAL`, `DATABASE_PORT_EXTERNAL` |

## Setup inicial

```bash
cp .env.example .env
pnpm run docker:up          # Postgres + API
pnpm migration:run          # aplica migrations (rodar no host)
```

Para subir só o banco:

```bash
docker compose -f docker-compose.local.yaml up postgres-manicure-db -d
```

## Comandos

| Comando                   | Descrição                                                             |
| ------------------------- | --------------------------------------------------------------------- |
| `pnpm migration:generate` | Compara entities com o banco e gera arquivo em `database/migrations/` |
| `pnpm migration:run`      | Aplica migrations pendentes                                           |
| `pnpm migration:revert`   | Desfaz a última migration                                             |
| `pnpm migration:show`     | Lista status das migrations                                           |

O TypeORM adiciona timestamp ao nome do arquivo gerado (ex.: `1782316320645-Migration.ts`). **Revise o SQL gerado antes de commitar.**

## Fluxo ao alterar o schema

1. Altere as entities em `src/modules/**/entities/`
2. Garanta Postgres rodando e `.env` com `DATABASE_HOST_EXTERNAL` / `DATABASE_PORT_EXTERNAL` corretos
3. `pnpm migration:generate` — revise o arquivo gerado
4. `pnpm migration:run`
5. Suba ou reinicie a API (`pnpm run start:dev` ou Docker)

## Boas práticas

- Nunca use `synchronize: true` em produção.
- Migrations geradas automaticamente podem incluir alterações indesejadas — sempre revise `up` e `down`.
- Em banco já existente (legado de `synchronize`), gere migrations com banco limpo ou ajuste manualmente o diff.
- Commite migrations junto com a alteração das entities.

## Referências

- Data source CLI: [`database/data-source.ts`](../database/data-source.ts)
- Config app: [`src/modules/database/configs/database.config.ts`](../src/modules/database/configs/database.config.ts)
- Compose local: [`docker-compose.local.yaml`](../docker-compose.local.yaml)
