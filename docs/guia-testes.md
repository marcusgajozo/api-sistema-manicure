# Guia de Testes

Este documento descreve a estrutura, a organização e a execução dos testes, e o princípio central: **testar comportamento, não detalhes de implementação**.

## Princípio: comportamento, não implementação

Teste o que o código **faz**, não **como** faz. Um bom teste descreve o comportamento observável — entrada e saída, estado persistido, evento emitido, contrato HTTP — e continua passando quando você refatora sem mudar comportamento.

Regra de ouro: **se você refatora mantendo o comportamento e o teste quebra, o teste está acoplado à implementação.**

O título de cada teste deve começar com **deve**, descrevendo o comportamento esperado: `it('deve criar um procedimento para o usuário', ...)`.

### Teste (bom)

- Retorno e erros de um use case ou serviço para uma dada entrada.
- Transições de estado e invariantes da entidade de domínio.
- O que foi persistido, verificado pelo próprio comportamento (ex.: criar e depois buscar).
- Contrato HTTP: rota, verbo, status, corpo e isolamento por usuário (e2e).
- Efeitos de domínio: um evento foi emitido, uma notificação foi criada.

### Não teste (ruim)

- Métodos privados ou funções internas.
- Que um colaborador foi chamado, com quais argumentos, quantas vezes ou em que ordem (`toHaveBeenCalledWith`, `toHaveBeenCalledTimes`) quando o retorno já prova o comportamento.
- A forma exata da query (`where`, `skip`, `take`, `order`) ou detalhes do TypeORM.
- Campos gerados internamente (`updatedAt`, `createdAt`), `expect.any(Date)`, ordem de chamadas.
- Detalhes de framework: que o decorator aplica, que o pipe transforma, que o guard chama.
- Mocks que replicam a implementação interna.
- Estado do banco por consulta direta quando a API já expõe o comportamento (e2e).

## Tipos de testes

### 1. Testes unitários (`src/**/*.spec.ts`)

- **Localização**: ao lado do arquivo correspondente, dentro de `src/`.
- **Objetivo**: testar o comportamento de use cases, entidades, validators, services, controllers e DTOs isoladamente.
- **Padrão-alvo (Clean Architecture)**: teste entidade, validator e use cases. Para o use case, use um **repositório fake em memória** e verifique o resultado — não use `@InjectRepository` nem asserte chamadas do repositório.
- **Legado**: services com repositório mockado, mas verificando o **resultado**, não as chamadas internas.
- **Comando**:
  ```bash
  pnpm run test
  ```

### 2. Testes end-to-end / E2E (`test/e2e/`)

Os testes E2E imitam a estrutura de módulos do código principal (`src/`), facilitando a localização de testes para cada funcionalidade. Testam o comportamento pela API (status, corpo, autenticação, isolamento entre usuários), **sem inspecionar tabelas ou classes internas**.

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

## Exemplos

### Use case (padrão-alvo)

Repositório fake em memória:

```ts
class InMemoryProcedureRepository implements IProcedureRepository {
  private readonly items: Procedure[] = [];

  async create(procedure: Procedure): Promise<Procedure> {
    const saved = Procedure.rehydrate({ ...procedure, id: 'generated-id' });
    this.items.push(saved);
    return saved;
  }

  async findById(id: string, userId: string): Promise<Procedure | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    );
  }
}
```

Evite — verifica a chamada do colaborador, não o comportamento:

```ts
it('deve chamar o repositório', async () => {
  const repository = { create: jest.fn() } as unknown as IProcedureRepository;
  const useCase = new CreateProcedureUseCase(repository);

  await useCase.execute({ name: 'Manicure', price: 5000, userId: 'user-1' });

  expect(repository.create).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Manicure' }),
  );
});
```

Prefira — verifica o efeito observável:

```ts
it('deve criar um procedimento para o usuário', async () => {
  const repository = new InMemoryProcedureRepository();
  const useCase = new CreateProcedureUseCase(repository);

  const created = await useCase.execute({
    name: 'Manicure',
    price: 5000,
    returnDays: 15,
    durationMinutes: 60,
    userId: 'user-1',
  });

  await expect(
    repository.findById(created.id, 'user-1'),
  ).resolves.toMatchObject({ name: 'Manicure', price: 5000 });
});

it('deve recusar um procedimento com preço negativo', async () => {
  const useCase = new CreateProcedureUseCase(new InMemoryProcedureRepository());

  await expect(
    useCase.execute({ name: 'Manicure', price: -1, userId: 'user-1' }),
  ).rejects.toThrow(DomainError);
});
```

### Serviço legado

Evite — acopla o teste à query do TypeORM:

```ts
it('deve buscar com paginação do usuário', async () => {
  repository.findAndCount.mockResolvedValue([procedures, 1]);

  await service.findAll({ page: 2, limit: 5 }, userId);

  expect(repository.findAndCount).toHaveBeenCalledWith({
    where: { user: { id: userId } },
    skip: 1,
    take: 5,
  });
});
```

Prefira — verifica o retorno:

```ts
it('deve retornar os procedimentos e o total', async () => {
  repository.findAndCount.mockResolvedValue([procedures, 1]);

  await expect(service.findAll({ page: 2, limit: 5 }, userId)).resolves.toEqual(
    { procedures, totalCount: 1 },
  );
});
```

O filtro por usuário é comportamento do repositório e é verificado no e2e (outro usuário recebe 404), não por asserção da query.

### E2E

```ts
it('deve retornar 404 ao acessar o procedimento de outro usuário', async () => {
  const ownerCookies = await authenticateE2eUser(httpServer);
  const otherUserCookies = await authenticateE2eUser(httpServer);

  await request(httpServer)
    .post('/procedures')
    .set('Cookie', ownerCookies)
    .send(createProcedurePayload())
    .expect(201);

  const list = await request(httpServer)
    .get('/procedures')
    .set('Cookie', ownerCookies)
    .expect(200);

  const procedureId = (list.body as PaginatedProceduresResponseBody).data[0].id;

  await request(httpServer)
    .get(`/procedures/${procedureId}`)
    .set('Cookie', otherUserCookies)
    .expect(404);
});
```

O teste cria via `POST` e verifica via `GET` — comportamento observável — em vez de consultar a tabela diretamente.

## Ao migrar um módulo

Ao migrar um módulo para Clean Architecture (`docs/guia-refatoracao.md`), ajuste os specs que assertam chamadas do repositório (`toHaveBeenCalledWith`) para assertarem comportamento. O `src/modules/procedures/services/procedures.service.spec.ts` é um exemplo a corrigir no piloto.

## Aliases de caminho (path aliases)

Para importar recursos nos testes E2E, utilize os aliases configurados:

- `@src/*`: aponta para `src/*`.
- `@test/e2e/*`: busca primeiramente em `test/e2e/src/*` (para módulos) e em seguida em `test/e2e/*` (para setup/helpers).

Exemplo:

```typescript
import { createE2eApp } from '@test/e2e/modules/app/create-e2e-app';
import { authenticateE2eUser } from '@test/e2e/modules/authentication/helpers/e2e-auth.helper';
```
