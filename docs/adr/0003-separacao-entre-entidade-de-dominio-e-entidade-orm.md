# 0003 — Entidade de domínio separada da entidade do TypeORM

- **Status**: Aceita
- **Registrada em**: 2026-10, sobre decisão anterior a este registro

## Contexto

Os módulos legados usam o padrão que o NestJS entrega de fábrica: entidades anotadas com decorators do TypeORM servem ao mesmo tempo de modelo de dados e de lugar onde as regras moram. Isso resolve o começo, mas amarra a regra de negócio ao banco. Testar o cálculo de um preço ou as regras de um agendamento passa a exigir subir o ORM, e uma mudança de schema arrasta mudança de regra.

O padrão-alvo é Clean Architecture aplicada de forma incremental, um módulo por vez, com `procedures` como piloto. Camadas e estrutura de pastas estão em [`../padrao-arquitetura.md`](../padrao-arquitetura.md).

## Decisão

Cada módulo novo, ou migrado, tem duas representações da mesma coisa:

- **Entidade de domínio**: classe TypeScript pura, sem decorators, sem importar TypeORM, validando invariantes no construtor, com `create` para objeto novo e `rehydrate` para objeto vindo do banco. Mudanças de estado são métodos dela (`changeDetails`, `cancel`).
- **`OrmEntity`**: em `infrastructure/entities/<entidade>.orm.ts`, conhecida só pela infraestrutura, mantendo nome de tabela e colunas do banco.

A conversão entre as duas é um **mapper** explícito. O repositório é definido por **interface no domínio** (`IProcedureRepository`) com token de injeção, e o caso de uso depende da interface, nunca da implementação. Erro de negócio é `DomainError` com chave de i18n, não exceção HTTP.

Casos de uso são classes comuns, sem `@Injectable()`, ligadas no módulo por `useFactory`. O domínio não importa `@nestjs/*`, `typeorm`, `class-validator` nem `nestjs-cls`.

## Alternativas consideradas

- **Usar a entidade do TypeORM como entidade de domínio**: menos arquivos e nenhum mapeamento. Descartada porque acopla regra de negócio ao ORM e obriga a subir banco para testar regra.
- **Active Record, com a persistência na própria entidade**: é o caminho mais direto. Descartada porque espalha I/O pelo domínio.
- **CQRS com `@nestjs/cqrs`**: organizaria a entrada em comandos e consultas. Descartada porque adiciona indireção sem resolver um problema atual do projeto. A decisão registrada é que controllers e handlers chamam os casos de uso diretamente, e que a dependência não entra no projeto.
- **Mapeamento automático entre as duas representações**: evitaria o mapper escrito à mão. Descartada porque as duas divergem de propósito, uma tem invariantes e a outra tem colunas, e mapeamento implícito esconde essa diferença.

## Consequências

- Mais arquivos por módulo: entidade, `OrmEntity`, mapper, interface e implementação de repositório, caso de uso e presenter.
- O mapeamento é escrito à mão e precisa acompanhar toda mudança de coluna.
- Caso de uso não é injetável por decorator, então o módulo cresce na lista de `useFactory`.
- Em troca, a regra de negócio é testável sem banco, o domínio não sabe que existe ORM, e a fronteira entre regra e persistência fica visível no código.
- Durante a migração, os dois padrões coexistem: código legado continua como está e código novo nasce no padrão-alvo.
