# FootManager 98 🏟️⚽

Um jogo completo de gerenciamento de futebol estilo anos 90, inspirado no clássico Elifoot 98. Gerencie seu clube, contrate jogadores, defina táticas e leve seu time ao topo!

## 🎮 Status: 100% COMPLETO E JOGÁVEL!

Este jogo está **totalmente funcional** com todas as features implementadas:

### ✅ Recursos Principais

- **Sistema de Simulação Completo**: Engine determinístico com comentários em português
- **Gestão Total do Clube**: Finanças, transferências, treinos e táticas
- **Interface Intuitiva**: Tutorial interativo, sons e notificações visuais
- **Sistema de Progressão**: Temporadas completas com promoção/rebaixamento
- **Saves Funcionais**: Sistema duplo (JSON + Banco de dados)
- **Multi-idioma Preparado**: Estrutura i18n pronta (PT-BR default)

## 🚀 Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/michelbr84/Elifoot98Clone.git
cd Elifoot98Clone

# 2. Instale as dependências
pnpm install
# ou
npm install

# 3. Configure o banco de dados
pnpm db:push
pnpm db:seed

# 4. Inicie o jogo!
pnpm dev
```

Acesse http://localhost:3000 e divirta-se!

## 🎯 Como Jogar

### Primeiros Passos
1. **Tutorial Automático**: Na primeira vez, um tutorial interativo irá guiá-lo
2. **Crie um Novo Jogo**: Escolha seu time e comece sua jornada
3. **Use os Botões Principais**:
   - 📅 **AVANÇAR 1 DIA** - Passa o tempo no jogo
   - ⚽ **JOGAR PRÓXIMA PARTIDA** - Simula seu próximo jogo
   - ⏩ **SIMULAR ATÉ PRÓXIMO JOGO** - Avança vários dias automaticamente

### Gerenciamento do Time
- **Elenco**: Veja estatísticas e gerencie seus jogadores
- **Táticas**: Defina formação (4-4-2, 4-3-3, etc) e estilo de jogo
- **Treinos**: 4 tipos diferentes (Fitness, Forma, Recuperação, Intensivo)
- **Transferências**: Compre e venda jogadores com IA de mercado
- **Finanças**: Gerencie receitas, salários e patrocínios

### Recursos Especiais
- **Sistema de Sons**: Sons gerados dinamicamente (compatível com Windows)
- **Notificações Visuais**: Feedback claro de todas as ações
- **Atalhos de Teclado**: Pressione "?" para ver todos
- **Auto-Save**: O jogo salva automaticamente a cada 7 dias

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Estilização**: Tailwind CSS (tema retro customizado)
- **Estado**: Zustand + Server Actions
- **Banco**: Prisma ORM + SQLite
- **Sons**: Web Audio API
- **Testes**: Vitest + Playwright

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Servidor de desenvolvimento
pnpm build            # Build de produção
pnpm start            # Servidor de produção

# Banco de dados
pnpm db:push          # Aplica o schema do Prisma
pnpm db:seed          # Popula com dados iniciais
pnpm db:studio        # Interface visual do banco

# Qualidade
pnpm lint             # Verifica linting
pnpm format           # Formatação automática
pnpm test             # Testes unitários
pnpm e2e              # Testes E2E
```

## 🎮 Features Implementadas

### Sistema de Jogo
- ✅ 4 divisões com 12 times cada
- ✅ Calendário completo (ida e volta)
- ✅ Engine de partida minuto-a-minuto
- ✅ Sistema de lesões e suspensões
- ✅ Cartões amarelos e vermelhos
- ✅ Final de temporada com promoções/rebaixamentos

### Gestão Financeira
- ✅ Bilheteria automática por partida
- ✅ Salários deduzidos semanalmente
- ✅ Patrocínio mensal por divisão
- ✅ Sistema de transferências com valores realistas
- ✅ Avisos de crise financeira

### Desenvolvimento de Jogadores
- ✅ Envelhecimento anual
- ✅ Redução de habilidade para veteranos
- ✅ Geração de jogadores jovens
- ✅ Sistema de treinos funcional
- ✅ Contratos com data de expiração

### Interface & UX
- ✅ Design retro inspirado nos anos 90
- ✅ Tutorial interativo para iniciantes
- ✅ Sistema de notificações elegante
- ✅ Sons para todas as ações
- ✅ Atalhos de teclado completos
- ✅ Loading states animados

## 🏗️ Estrutura do Projeto

```
FootManager98/
├── app/                    # Next.js App Router
├── src/
│   ├── game/              # Lógica do jogo
│   │   ├── engine/        # Motor de simulação
│   │   ├── rules/         # Regras e validações
│   │   ├── commentary/    # Sistema de comentários
│   │   ├── news/          # Gerador de notícias
│   │   └── save/          # Sistema de saves
│   ├── lib/               # Utilitários e gerenciadores
│   ├── state/             # Estado global (Zustand)
│   ├── ui/                # Componentes React
│   └── hooks/             # Custom React hooks
├── prisma/                # Schema do banco
├── i18n/                  # Traduções (preparado)
├── docs/                  # Documentação completa
└── saves/                 # Arquivos de save JSON
```

## 📚 Documentação

- [Arquitetura](docs/ARCHITECTURE.md) - Estrutura técnica do projeto
- [Regras do Jogo](docs/GAME_RULES.md) - Como o jogo funciona
- [Save Format](docs/SAVE_FORMAT.md) - Estrutura dos saves
- [Roadmap](docs/ROADMAP.md) - Plano de desenvolvimento

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

**Aviso Legal**: Este é um projeto fan-made sem fins lucrativos, sem afiliação com os criadores originais do Elifoot.

## 🙏 Agradecimentos

- Inspirado no clássico Elifoot 98
- Comunidade Next.js pela excelente documentação
- Todos que contribuíram com feedback e testes

## 🐛 Problemas Conhecidos

O jogo está 100% funcional! Pequenas melhorias planejadas:
- Modo multiplayer hot-seat
- Copa nacional
- Mais idiomas na interface
- Modo escuro

## 📞 Suporte

- **Issues**: Use a aba Issues do GitHub
- **Discussões**: Use GitHub Discussions para sugestões

---

**Desenvolvido com ❤️ para os fãs de jogos de gerenciamento de futebol**

*Última atualização: Janeiro 2025*