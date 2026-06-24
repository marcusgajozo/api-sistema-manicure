# Commit Style Guide

## Visão geral

Este documento define as regras para commits no projeto. Seguindo essas diretrizes, o histórico fica claro, compreensível e consistente.

## Convenções de mensagem

As mensagens devem seguir o formato [Conventional Commits](https://www.conventionalcommits.org/). **Assunto e corpo são escritos em português.** O tipo e o escopo permanecem no padrão conventional (em inglês). Exemplo:

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
- **test**: adicionar testes faltantes
- **chore**: processo de build, atualização de bibliotecas, etc.

### Estrutura da mensagem

A mensagem deve conter uma linha de assunto (subject) e um corpo (body) opcional. O header (`<tipo>(<escopo>): <assunto>`) deve ter no máximo **72 caracteres** e seguir o formato:

```
<tipo>(<escopo>): <assunto>
```

O corpo pode trazer detalhes adicionais em markdown.

## Exemplos

- **feat(auth): adiciona fluxo de login com JWT**
- **fix(clients): trata datasets grandes na listagem**
- **docs(api): atualiza documentação do novo endpoint**

Exemplo com corpo:

```
feat(users): adiciona endpoint de upload de avatar

Adiciona endpoint para upload de avatar com validação de tipo
e tamanho de arquivo. O avatar é redimensionado para 200x200.
```

## Diretrizes adicionais

- O assunto deve estar no imperativo em português (ex.: _adiciona_, _corrige_, _atualiza_).
- O limite de **72 caracteres** vale para o **header inteiro** (`tipo(escopo): assunto`). Prefira escopos curtos (`config`, `gitignore`) e detalhes no corpo.
- Mantenha o assunto conciso e focado na mudança.
- O corpo deve fornecer contexto suficiente quando o assunto não for autoexplicativo.
- Evite merge commits; prefira squash quando possível.
