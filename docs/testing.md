# Guia de Testes

Este documento descreve a estrutura, organização e execução de testes no projeto.

## Tipos de Testes

### 1. Testes Unitários (`src/**/*.spec.ts`)

- **Localização**: Ficam colocados lado a lado com os arquivos correspondentes dentro de `src/`.
- **Objetivo**: Testar controllers, serviços, DTOs, decoradores e pipes isoladamente, mockando dependências.
- **Comando**:
  ```bash
  pnpm run test
  ```

### 2. Testes End-to-End / E2E (`test/e2e/`)

Os testes E2E imitam a estrutura de módulos do código principal (`src/`), facilitando a localização de testes para cada funcionalidade.

#### Estrutura do diretório `test/e2e/`:

```
test/
├── helpers/                   # Helpers genéricos de testes
├── jest-e2e.json              # Configuração do Jest para testes E2E
├── jest.setup.ts              # Setup global de ambiente de testes
└── e2e/
    ├── setup/                 # Configurações de infra/ambiente do E2E (ex.: load-e2e-env.ts)
    ├── helpers/               # Helpers globais específicos de E2E (se houver)
    └── src/                   # Estrutura espelhada de src/ para os testes E2E
        └── modules/           # Módulos E2E espelhando src/modules/
            ├── app/
            ├── appointments/
            ├── authentication/
            ├── clients/
            ├── database/
            ├── i18n/
            ├── procedures/
            ├── schedule-templates/
            └── time-offs/
```

- **`test/e2e/setup/`**: Configuração e inicialização de variáveis de ambiente para testes E2E.
- **`test/e2e/src/modules/`**: Contém as suítes `.e2e-spec.ts`, fixtures e helpers específicos de cada módulo.

- **Comando**:
  ```bash
  pnpm run test:e2e
  ```

## Aliases de Caminho (Path Aliases)

Para importar recursos nos testes E2E, utilize os aliases configurados:

- `@src/*`: Aponta para `src/*`
- `@test/e2e/*`: Busca primeiramente em `test/e2e/src/*` (para módulos) e em seguida em `test/e2e/*` (para setup/helpers)

Exemplo:

```typescript
import { createE2eApp } from '@test/e2e/modules/app/create-e2e-app';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
```
