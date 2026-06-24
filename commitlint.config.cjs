module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
  },
  prompt: {
    messages: {
      skip: 'pular',
      max: 'máximo de %d caracteres',
      min: 'mínimo de %d caracteres',
      emptyWarning: 'não pode ficar vazio',
      upperLimitWarning: 'acima do limite',
      lowerLimitWarning: 'abaixo do limite',
    },
    questions: {
      type: {
        description: 'Selecione o tipo da mudança:',
        enum: {
          feat: {
            title: 'Funcionalidade',
            description: 'Nova funcionalidade',
          },
          fix: {
            title: 'Correção',
            description: 'Correção de bug',
          },
          docs: {
            title: 'Documentação',
            description: 'Mudanças em documentação',
          },
          style: {
            title: 'Estilo',
            description: 'Formatação ou mudanças cosméticas',
          },
          refactor: {
            title: 'Refatoração',
            description: 'Refatoração sem mudar a API pública',
          },
          test: {
            title: 'Testes',
            description: 'Adicionar ou corrigir testes',
          },
          chore: {
            title: 'Manutenção',
            description: 'Build, dependências e tarefas gerais',
          },
        },
      },
      scope: {
        description: 'Escopo da mudança (opcional):',
      },
      subject: {
        description:
          'Descreva a mudança em português, no imperativo (ex.: adiciona, corrige, atualiza). Máximo 72 caracteres no header inteiro.',
      },
      body: {
        description: 'Corpo da mensagem em português (opcional):',
      },
    },
  },
};
