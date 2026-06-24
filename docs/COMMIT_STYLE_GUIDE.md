# Commit Style Guide

## Visão geral

Este documento define as regras para commits no projeto. **Mensagens geradas pelo VS Code/Copilot devem seguir este guia integralmente.**

## Regras para geração automática (VS Code / IA)

**O header completo** (`<tipo>(<escopo>): <assunto>`) deve ter **no máximo 72 caracteres**.

Antes de finalizar a mensagem:

1. Conte os caracteres do header inteiro (inclui `tipo`, `(escopo)`, `: ` e assunto).
2. Se passar de 72, encurte o assunto ou use um escopo mais curto.
3. Coloque detalhes no corpo da mensagem, não no header.

### Exemplo inválido (78 caracteres — rejeitado pelo commitlint)

```
test(decorators): adiciona testes para decoradores de validação de data e hora
```

### Versão válida (47 caracteres)

```
test(common): adiciona testes de data e hora

Cobre decoradores IsBeforeDate e IsBeforeTime.
```

### Como encurtar

| Evite                                                          | Prefira                          |
| -------------------------------------------------------------- | -------------------------------- |
| `decorators`                                                   | `common`                         |
| `adiciona testes para decoradores de validação de data e hora` | `adiciona testes de data e hora` |
| detalhes no header                                             | detalhes no corpo                |

## Convenções de mensagem

As mensagens devem seguir o formato [Conventional Commits](https://www.conventionalcommits.org/). **Assunto e corpo são escritos em português.** O tipo e o escopo permanecem no padrão conventional (em inglês).

```
feat(auth): adiciona fluxo de login com JWT

Implementa autenticação com validação de credenciais e emissão de token.
```

### Tipos de commit

- **feat**: uma nova funcionalidade
- **fix**: correção de bug
- **docs**: mudanças em documentação
- **style**: formatação ou mudanças cosméticas
- **refactor**: refatoração sem mudar a API pública
- **test**: adicionar ou corrigir testes
- **chore**: processo de build, atualização de bibliotecas, etc.

### Escopos comuns (use nomes curtos)

`appointments`, `auth`, `clients`, `common`, `config`, `docker`, `docs`, `gitignore`, `i18n`, `procedures`, `schedule-templates`, `time-offs`, `users`

### Estrutura da mensagem

```
<tipo>(<escopo>): <assunto>
```

- **Header**: máximo **72 caracteres**, português, imperativo
- **Corpo** (opcional): português, com contexto adicional

## Exemplos válidos

- `feat(auth): adiciona fluxo de login com JWT` (40 caracteres)
- `test(common): adiciona testes de data e hora` (43 caracteres)
- `docs(config): atualiza guia de commits` (36 caracteres)
- `chore(gitignore): adiciona exceção no workspace` (47 caracteres)

Exemplo com corpo:

```
feat(users): adiciona endpoint de upload de avatar

Adiciona endpoint para upload de avatar com validação de tipo
e tamanho de arquivo. O avatar é redimensionado para 200x200.
```

## Diretrizes adicionais

- O assunto deve estar no imperativo em português (ex.: _adiciona_, _corrige_, _atualiza_).
- Nunca use inglês no assunto.
- Não use ponto final no assunto.
- O limite de 72 caracteres vale para o **header inteiro**, não só o assunto.
- Mantenha o assunto conciso; detalhes vão no corpo.
- Evite merge commits; prefira squash quando possível.
