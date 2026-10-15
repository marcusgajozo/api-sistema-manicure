# Decisões de arquitetura (ADRs)

Registro das decisões de arquitetura deste projeto no formato de Architecture Decision Records: contexto, decisão, alternativas descartadas e consequências.

O padrão de código vigente está em [`../padrao-arquitetura.md`](../padrao-arquitetura.md). A diferença é o foco: a ADR explica **por que** a decisão foi tomada e o que foi deixado de lado; o guia explica **como** aplicar o padrão no dia a dia.

| Número                                                     | Decisão                                                   | Status |
| ---------------------------------------------------------- | --------------------------------------------------------- | ------ |
| [0001](0001-migrations-como-unica-forma-de-alterar-o-schema.md) | Schema alterado apenas por migrations versionadas       | Aceita |
| [0002](0002-autenticacao-com-jwt-em-cookie-httponly.md)    | Autenticação por JWT em cookie httpOnly, com guard global | Aceita |
| [0003](0003-separacao-entre-entidade-de-dominio-e-entidade-orm.md) | Entidade de domínio separada da entidade do TypeORM | Aceita |

## Como registrar uma decisão nova

1. Copie a estrutura de uma ADR existente.
2. Numere com o próximo número da sequência. Número de ADR descartada antes de ser aceita não é reaproveitado.
3. Escreva no mesmo pull request que aplica a decisão, ou logo depois dele.
4. ADR aceita não é reescrita. Para mudar de rumo, crie uma ADR nova e marque a anterior como `Substituída pela 000Y`.
