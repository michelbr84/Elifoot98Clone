# TODO - FootManager 98

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### Bugs que Impedem o Jogo (URGENTE)
- [ ] Erro 500 ao aplicar treinos - schema do banco incompatível
- [ ] Não está claro como avançar dias ou jogar
- [ ] Algumas funções parecem estáticas/simuladas
- [ ] Falta sistema de sons do Windows

### Problemas de UX (CRÍTICO)
- [ ] Jogador não sabe como jogar/avançar no tempo
- [ ] Falta feedback visual claro das ações
- [ ] Sem tutorial ou instruções iniciais
- [ ] Mensagens de erro não são claras

## 📋 PLANO DE AÇÃO IMEDIATO

### 1. Corrigir Erro de Treinos
- [ ] Ajustar schema do Training no Prisma
- [ ] Atualizar função applyTraining
- [ ] Executar migration
- [ ] Testar treinos

### 2. Sistema de Progressão Clara
- [ ] Adicionar botões grandes e visíveis para avançar dia
- [ ] Implementar "Simular até próximo jogo"
- [ ] Feedback visual quando ação é executada
- [ ] Indicadores de progresso

### 3. Tutorial e Instruções
- [ ] Tela inicial com instruções básicas
- [ ] Tooltips explicativos nos botões
- [ ] Guia passo-a-passo inicial
- [ ] Mensagens de ajuda contextuais

### 4. Sistema de Sons
- [ ] Implementar sons usando Web Audio API
- [ ] Som de clique nos botões
- [ ] Som de gol/evento importante
- [ ] Música de fundo opcional

### 5. Melhorias de Feedback
- [ ] Loading states mais claros
- [ ] Notificações de sucesso/erro
- [ ] Animações de transição
- [ ] Confirmações visuais

## ✅ Já Implementado (mas precisa refinamento)

### Sistema Base
- [x] Bootstrap do projeto
- [x] Prisma + SQLite
- [x] Documentação

### Gameplay Core
- [x] Gerador de calendário
- [x] Engine de partida
- [x] Sistema de lesões
- [x] Validação de escalação
- [x] Final de temporada
- [x] Progressão temporal

### Interface & Views
- [x] Todas as views criadas
- [x] Sistema de saves
- [x] Atalhos de teclado

### Sistemas Avançados
- [x] Sistema financeiro
- [x] Gestão de jogadores
- [x] Sistema de transferências

## 🎯 OBJETIVO: Tornar o jogo realmente jogável e intuitivo!