# TODO - FootManager 98

## ✅ Concluído

### Marco A - MVP
- [x] Bootstrap do projeto (Next.js, TypeScript, Tailwind, ESLint, Prettier, Husky, Vitest)
- [x] Prisma + SQLite, schema e seed básico
- [x] Gerador de calendário + sistema de classificação
- [x] Engine de partida v1 com comentários PT-BR
- [x] UI básica (Home, Elenco, Tática, Jogos, Tabela)
- [x] Sistema de saves (JSON + DB)
- [x] i18n estrutura (PT-BR default)
- [x] Testes unitários e E2E smoke
- [x] Documentação (Architecture, Game Rules, Save Format, Roadmap)

## 🚧 Pendente

### Bugs Críticos
- [ ] Corrigir erro "__webpack_require__.n is not a function" no GameLayout
- [ ] Atualizar Next.js para versão mais recente
- [ ] Verificar compatibilidade de dependências

### Funcionalidades Incompletas (Marco A)
- [ ] View de Táticas funcional (atualmente só placeholder)
- [ ] View de Fixtures/Jogos funcional (atualmente só placeholder)
- [ ] Sistema de treinos básico
- [ ] Sistema financeiro básico (bilheteria, salários)
- [ ] Botão "Jogar Próxima Partida" funcional
- [ ] Exibição de resultados das partidas
- [ ] Log de eventos/notícias
- [ ] Sistema de lesões e suspensões aplicado
- [ ] Validação de escalação (11 jogadores, posições corretas)

### Melhorias de UX
- [ ] Loading states durante simulação
- [ ] Feedback visual para ações do usuário
- [ ] Mensagens de erro mais claras
- [ ] Confirmação antes de ações importantes
- [ ] Atalhos de teclado implementados
- [ ] Tooltips informativos

### Testes Adicionais
- [ ] Testes de integração para server actions
- [ ] Testes E2E para salvar/carregar jogo
- [ ] Testes E2E para simular temporada completa
- [ ] Testes de performance
- [ ] Testes de acessibilidade

### Performance
- [ ] Otimizar queries do Prisma
- [ ] Implementar cache para dados estáticos
- [ ] Lazy loading de componentes pesados
- [ ] Otimizar bundle size

### Marco B - Profundidade
- [ ] Mercado de transferências
- [ ] Sistema financeiro completo
- [ ] Treinos e desenvolvimento de jogadores
- [ ] Copa nacional
- [ ] Multi-manager hot-seat
- [ ] Comentários multi-idioma
- [ ] Sistema de moral e forma

### Marco C - Polimento
- [ ] Suporte PostgreSQL
- [ ] Docker compose
- [ ] Export/Import de saves
- [ ] Relatório detalhado de partidas
- [ ] Dark mode
- [ ] PWA support