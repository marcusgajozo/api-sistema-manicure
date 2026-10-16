# 0002 — Autenticação por JWT em cookie httpOnly com guard global

- **Status**: Aceita
- **Registrada em**: 2026-10, sobre decisão anterior a este registro

## Contexto

A API é consumida por uma interface web própria (`sistema-manicure-web`). Depois do login, cada requisição precisa identificar o usuário para escopar os dados por ele, e quase todas as rotas exigem autenticação, com poucas exceções, como o próprio login.

Guardar o token apenas na memória do front faria a sessão cair a cada recarregamento de página. Guardá-lo em `localStorage` o deixaria legível por qualquer JavaScript executado na página.

## Decisão

O login é `POST /authentication/sign-in`, marcado com `@Public()`, que grava o JWT em cookie `httpOnly` e **não devolve o token no corpo da resposta**. A resposta traz apenas dados do usuário (id e e-mail).

O `JwtAuthGuard` é registrado como `APP_GUARD` no `AppModule`: o padrão de toda rota é exigir autenticação, e rota aberta precisa declarar `@Public()`, verificado com `Reflector` dentro do guard.

Depois de autenticar, o usuário é colocado no contexto da requisição com `nestjs-cls`. A presentation o recupera com o helper de usuário logado e passa o `userId` ao caso de uso. O domínio nunca lê contexto de requisição.

As opções do cookie vêm de configuração: `httpOnly` sempre verdadeiro, `secure` e `sameSite` (padrão `lax`) por variável de ambiente, e `maxAge` derivado de `JWT_EXPIRES_IN` (padrão de uma hora).

## Alternativas consideradas

- **Token no corpo da resposta, guardado em `localStorage` e enviado no cabeçalho `Authorization`**: é o padrão mais comum em API consumida por SPA. Descartada porque o token fica acessível a JavaScript e, portanto, exposto a XSS.
- **Guard declarado rota a rota**: deixa explícito quais rotas exigem autenticação. Descartada porque rota nova sem guard nasce aberta, e o modo de falha seria o pior possível.
- **Sessão no servidor em memória**: descartada porque não sobrevive a múltiplas instâncias da API.
- **Sessão no servidor com Redis**: resolveria o compartilhamento entre instâncias, mas adiciona uma dependência de infraestrutura que o projeto não tem hoje.

## Consequências

- O CORS precisa liberar credenciais para o endereço do front, e não apenas a origem.
- Como o navegador envia o cookie por conta própria, proteção contra CSRF passa a ser relevante. As mitigações presentes são `sameSite` (padrão `lax`) e `secure` em produção; usar `sameSite: none` exige `secure: true` e transforma CSRF em um risco a tratar de forma explícita.
- O token não é legível por JavaScript, então um XSS não consegue roubar a sessão.
- O controller de autenticação expõe apenas o `sign-in`: encerrar a sessão depende de o cookie expirar, ou de um endpoint de sign-out a criar.
- Rota nova nasce protegida. Esquecer o `@Public()` deixa a rota inacessível ao público, que é um erro mais fácil de detectar do que o contrário.
