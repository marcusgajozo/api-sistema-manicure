# 0001 — Schema alterado apenas por migrations versionadas

- **Status**: Aceita
- **Registrada em**: 2026-10, sobre decisão anterior a este registro

## Contexto

O projeto usa TypeORM 0.3 com PostgreSQL 18 e nasceu com o schema sendo criado pelo próprio ORM a partir das entidades. Isso funciona enquanto o schema está em movimento constante e existe um ambiente descartável para experimentar.

Quando o banco passou a ter dados reais, a criação implícita de schema virou risco: alterar uma entidade se refletia no banco sem revisão, sem histórico e sem caminho de volta, e dois ambientes podiam divergir sem que ninguém percebesse.

## Decisão

Toda alteração de schema passa a ser feita por migration versionada em `database/migrations/`, com `synchronize: false` na configuração da API.

- O schema de qualquer ambiente é o resultado da soma das migrations aplicadas, na ordem.
- Cada migration tem `up` e `down`, ambos reversíveis.
- Migration já aplicada nunca é editada: correção vira migration nova.
- A migration é commitada junto da alteração das entidades.
- O CLI do TypeORM roda pelo host, lendo `DATABASE_HOST_EXTERNAL` e `DATABASE_PORT_EXTERNAL`, separado da conexão da API, que roda no Docker com `DATABASE_HOST` e `DATABASE_PORT`. Detalhes em [`../guia-banco-de-dados.md`](../guia-banco-de-dados.md).

## Alternativas consideradas

- **Manter `synchronize: true`**: o schema acompanha as entidades sem SQL escrito à mão. Descartada porque altera o banco de qualquer ambiente sem revisão, não deixa histórico e não tem rollback.
- **Aplicar SQL manualmente**: controle total do que é executado. Descartada porque depende de disciplina para ser reproduzida em todo ambiente e abre espaço para divergência silenciosa.
- **Escrever todas as migrations à mão**: evita SQL indesejado do gerador. Descartada em favor de `migration:generate` com revisão obrigatória, que erra menos nas alterações comuns.

## Consequências

- Alterar schema passou a custar mais passos: gerar, revisar o SQL, aplicar e commitar.
- O gerador pode incluir mudanças que ninguém pediu, então revisar `up` e `down` não é opcional.
- É preciso um Postgres acessível pelo host para gerar e aplicar migration.
- Em troca, o schema é reproduzível, auditável e reversível: um banco vazio pode ser reconstruído aplicando as migrations em sequência.
