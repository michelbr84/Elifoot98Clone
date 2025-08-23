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
- [x] View de Táticas funcional com formações e sliders
- [x] View de Fixtures/Jogos funcional com calendário
- [x] Sistema financeiro básico (bilheteria, transações)
- [x] Botão "Jogar Próxima Partida" funcional
- [x] Exibição de resultados das partidas com modal
- [x] Log de eventos/notícias automático
- [x] Sistema de lesões e suspensões aplicado
- [x] Atalhos de teclado implementados
- [x] Loading spinner
- [x] Sistema de treinos UI
- [x] Validação de escalação

## 🚧 PENDENTE - PARA COMPLETAR 100%

### Funcionalidades Faltando (CRÍTICO)
- [ ] View de Transferências funcional (ainda está "Em construção")
- [ ] Server action para salvar táticas (TacticsView tem TODO)
- [ ] Server action para aplicar treinos (TrainingView tem TODO)
- [ ] Sistema de progressão do tempo automático
- [ ] Final de temporada (promoção/rebaixamento)
- [ ] Tela de configurações/settings
- [ ] Tela inicial de seleção de idioma
- [ ] Aplicar traduções i18n (arquivos existem mas não são usados)

### Bugs e Melhorias Necessárias
- [ ] Tática salva não é usada nas partidas (sempre usa 4-4-2)
- [ ] Treinos não afetam realmente os jogadores
- [ ] Sistema financeiro não deduz salários automaticamente
- [ ] Não há limite de endividamento implementado
- [ ] Jogadores não envelhecem com o tempo
- [ ] Contratos não expiram
- [ ] Não há geração de novos jogadores jovens
- [ ] Patrocínio não é creditado mensalmente

### UX Crítica Faltando
- [ ] Confirmação antes de ações importantes (novo jogo, deletar save)
- [ ] Mensagens de erro mais claras
- [ ] Feedback quando ação é executada com sucesso
- [ ] Indicador de dia/mês/ano mais visível
- [ ] Tutorial ou tela de ajuda inicial

### Testes Mínimos Necessários
- [ ] Teste E2E de jogo completo funcionando
- [ ] Teste de saves funcionando corretamente
- [ ] Verificar se testes existentes passam

## 📋 PLANO DE AÇÃO

1. Implementar View de Transferências
2. Conectar server actions de táticas e treinos
3. Sistema de progressão temporal automático
4. Final de temporada com promoções
5. Aplicar sistema i18n
6. Corrigir bugs críticos
7. Melhorias de UX essenciais
8. Executar e corrigir testes