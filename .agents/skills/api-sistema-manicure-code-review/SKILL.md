---
name: api-sistema-manicure-code-review
description: 'Use ao revisar código da API Sistema Manicure (git diff, branch, commit ou arquivos/módulo indicados) sob a ótica de Clean Architecture, dos padrões do projeto e de SOLID. Apenas aponta melhorias e recomendações — nunca altera o código. Não use para redigir a mensagem de commit (use git-commit-convention) nem para migrar um módulo legado (siga docs/guia-refatoracao.md).'
---

# API Sistema Manicure — Revisor de Código

## Escopo

Analisar código deste projeto e devolver um relatório de recomendações, priorizado. A fonte das regras é `AGENTS.md`, `docs/padrao-arquitetura.md` e `docs/guia-refatoracao.md`; leia os três antes de revisar. O padrão-alvo é Clean Architecture, com módulos legados em migração (piloto: `procedures`).

## Regras invioláveis

- **Somente leitura**: nunca criar, editar ou excluir arquivos, nem rodar comando que altere o repositório (commit, branch, reset, checkout). Use `read`/`grep`/`glob` e apenas `git` de leitura (`git diff`, `git show`, `git log`, `git status`, `git rev-parse`, `git name-rev`).
- Baseie as recomendações no que está documentado. Não invente requisitos nem imponha padrão que o projeto não adota.
- **Não aponte o que o ESLint/Prettier já resolve** (formatação, ordenação de imports, aspas, ponto e vírgula). Foque em conteúdo, responsabilidades e arquitetura.
- Sugira trechos pequenos e localizados; não proponha reescritas gigantes.
- Toda observação cita o arquivo e o trecho/linha do diff.
- Classifique cada ponto em **Alta / Média / Baixa** prioridade.
- Ao encontrar segredo exposto, apenas sinalize — nunca reproduza o valor.
- Se o código estiver alinhado, elogie as decisões arquiteturais.

## Como obter o código

- Sem indicação do usuário: rode `git diff` e, se houver algo em stage, `git diff --cached`.
- Para um commit ou branch: `git show <ref>` ou `git diff <base>...<head>`.
- Para arquivos ou um módulo: leia com `read`/`grep`/`glob`.
- Trabalhe sempre no diretório atual; nunca mude de diretório.

## Diretrizes de análise

### 1. Clean Architecture (código novo)

- `domain/` é TypeScript puro: sem `@nestjs/*`, `typeorm`, `class-validator`, `class-transformer`, `nestjs-cls` ou imports de outra camada.
- Entidade de domínio separada da `OrmEntity`; conversão só pelo mapper.
- Use case é classe comum com `execute`, sem `@Injectable()`/`@Inject()` nem imports de framework; depende de `I<Entidade>Repository` via token e é registrado com `useFactory` no módulo. `@InjectRepository`, `Repository<T>` e `EntityManager` só em `infrastructure/`.
- `domain` e `application` lançam `DomainError`/`NotFoundError` (framework-free), nunca `BadRequestException`/`NotFoundException`; a presentation e o `GlobalExceptionFilter` traduzem para HTTP/i18n.
- Controller e handler finos: convertem, chamam o use case e apresentam; sem regra de negócio nem repositório.
- Sem CQRS (`CommandBus`, `QueryBus`, `EventBus`, pastas `commands/`/`queries/`).
- Serviço externo por porta em `domain/ports/` + adapter em `infrastructure/adapters/`.
- Comunicação entre módulos por token/use case; nunca importar `OrmEntity` de outro módulo em código novo.

### 2. Padrões do projeto

- Nenhum comentário em nenhum arquivo (TS, SQL, JSON, config).
- Mensagens de erro/validação via i18n (`validation.*`, `exception.*`); nunca texto hardcoded. `src/generated/` não é editado à mão.
- Imports com alias (`@/*`, `@src/*`, `@test/*`, `@test/e2e/*`); sem caminho relativo entre módulos.
- Entrada validada por DTO (`class-validator`); UUID de rota com `VerifyUUIDIdPipe`.
- Escopo por usuário: `getLoggedInUserHelper()` na presentation, filtro por `user.id`; nunca confiar em `userId` vindo do cliente.
- Contratos HTTP preservados: rotas, verbos, status codes e corpo (`ResponseDto`/`PaginatedResponseDto`).
- `OrmEntity` fica em `infrastructure/entities/<entidade>.orm.ts`, estende `BaseEntity`, com colunas em `snake_case` e remoção por soft delete.
- Sem strings mágicas de domínio: enums/constantes.
- Eventos de domínio via `EventEmitter2` (`emitAsync` + `@OnEvent`); handlers só orquestram use cases.
- Schema do banco só por migration (`synchronize: false`), com `down` reversível.

### 3. Legado em transição

- Se o diff toca módulo legado: funcionalidade nova deve nascer no padrão-alvo.
- Correção pontual pode seguir o padrão existente, mas **sem novos acoplamentos** (novo `@InjectRepository` de entidade de outro módulo, regra de negócio em controller ou handler).
- Sinalize desvios conhecidos (seção 5 de `docs/guia-refatoracao.md`) apenas quando o diff os introduz ou agrava.

### 4. SOLID

- **SRP**: classe/função com um único motivo para mudar.
- **DIP**: aplicação e apresentação dependem de interfaces, não de infraestrutura concreta.
- **OCP/ISP/LSP** quando aplicável.
- Avalie o impacto das mudanças: acoplamentos que dificultam uma alteração futura.

### 5. Testes

- Feature ou correção acompanhada do teste correspondente; specs ao lado do arquivo; e2e quando o fluxo é coberto por e2e.
- Entidades, validators e use cases testados por comportamento, com repositório fake em memória (não `@InjectRepository`).
- Teste verifica comportamento, não implementação: sinalize `toHaveBeenCalledWith`/`toHaveBeenCalledTimes` de colaboradores, asserção de query (`where`, `skip`, `take`), `expect.any(Date)` e teste de método privado (ver `docs/guia-testes.md`).
- Se o diff muda comportamento sem ajustar testes, sinalize.

### 6. Segurança

- Segredos de `.env*` não versionados, logados ou exibidos.
- Rotas sob o guard global; `@Public()` só quando justificado.
- Consultas filtram pelo usuário logado (evitar acesso a dado de outro usuário/IDOR).

## Formato da resposta

Para cada ponto:

1. **Arquivo/trecho**: arquivo e linhas do diff.
2. **Observação**: qual princípio ou regra do projeto é violado e por quê.
3. **Sugestão**: trecho pequeno mostrando como mover a responsabilidade para a camada correta.

Ao final, uma seção **Resumo** com a contagem de pontos por categoria e as prioridades (Alta / Média / Baixa). Se não houver pontos, confirme que o diff está alinhado e destaque o que ficou bom.

## Referências no projeto

- `docs/padrao-arquitetura.md` — padrão-alvo e convenções.
- `docs/guia-refatoracao.md` — status da migração e desvios conhecidos.
- `docs/guia-testes.md` — estrutura de testes unitários e e2e.
- `AGENTS.md` — regras absolutas e quality gate.
