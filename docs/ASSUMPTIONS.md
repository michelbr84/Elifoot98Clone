# Decisões e Suposições

Este documento registra todas as decisões tomadas durante o desenvolvimento sem consultar o usuário.

## Decisões Técnicas

### Stack
- **Next.js 14** com App Router por ser a versão mais moderna e estável
- **pnpm** como gerenciador de pacotes padrão (mais rápido e eficiente)
- **SQLite** para desenvolvimento e **PostgreSQL** para produção
- **Tailwind CSS** com tema retro customizado
- **Zustand** para estado do cliente (mais leve que Redux)
- **Prisma** como ORM por sua type-safety e developer experience

### Arquitetura
- Server Components por padrão, Client Components apenas quando necessário
- Server Actions para mutações em vez de API routes tradicionais
- Estado do jogo dividido entre servidor (source of truth) e cliente (UI state)
- Saves em JSON no filesystem + backup no banco de dados

### Seed e Geração de Dados
- Uso de `seedrandom` para determinismo na geração de dados
- Nomes fictícios gerados proceduralmente (sem usar APIs externas)
- 4 divisões com 12 clubes cada por padrão (48 clubes total)
- 20 jogadores por clube (960 jogadores total)

## Decisões de Game Design

### Estrutura de Ligas
- 4 divisões nacionais (Série A, B, C, D)
- 12 clubes por divisão (tamanho ideal para calendário)
- Sistema de pontos: 3 vitória, 1 empate, 0 derrota
- Top 3 sobem, bottom 3 descem

### Atributos dos Jogadores
- Overall: 1-100 (distribuição normal, média 60)
- Posições: GK, DF, MF, FW (simplificado)
- Fitness: 0-100 (gasto durante partidas)
- Form: 0-100 (varia com performance)
- Morale: 0-100 (afetada por resultados e salários)
- Idade: 17-40 anos

### Sistema Financeiro
- Moeda fictícia: § (Símbolos)
- Receitas: bilheteria, patrocínio, vendas
- Despesas: salários, manutenção, compras
- Patrocínio base: §100k/temporada para Série A

### Engine de Partida
- Simulação minuto a minuto (90 minutos + acréscimos)
- Probabilidades baseadas em ratings dos setores
- Vantagem de casa: +10% nas chances
- Lesões: 1% chance por tackle duro
- Cartões: baseados em agressividade tática

### Mercado de Transferências
- Janelas: Jul-Ago (verão) e Jan (inverno)
- Preços baseados em: overall, idade, contrato restante
- IA simples: clubes tentam manter 20-25 jogadores
- Salários: proporcionais ao overall e divisão

## Decisões de UX/UI

### Visual
- Tema "retro clean" inspirado em interfaces dos anos 90
- Cores principais: verde (positivo), vermelho (negativo), âmbar (neutro)
- Fonte monoespaçada para dados numéricos
- Sem imagens ou assets externos (tudo CSS/SVG)

### Navegação
- Menu lateral fixo com todas as seções principais
- Breadcrumbs para navegação contextual
- Atalhos de teclado para ações frequentes
- Confirmação para ações destrutivas

### Idiomas
- PT-BR como padrão (público principal)
- Suporte para EN e ES
- Detecção automática baseada no navegador
- Troca de idioma sem recarregar página

## Limitações Aceitas

### Performance
- Máximo 4 managers simultâneos (limitação de hot-seat)
- Saves limitados a 10MB (cerca de 10 temporadas)
- Simulação de 1 partida por vez

### Realismo
- Sem scouts ou categorias de base
- Sem competições internacionais
- Sem variação de público por desempenho
- Contratos simplificados (apenas duração e salário)

### Dados
- Todos os nomes são fictícios e gerados
- Sem logos ou escudos reais
- Sem estádios específicos
- Sem histórico pré-jogo

## Padrões de Código

### Nomenclatura
- Componentes: PascalCase
- Funções/variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE
- Arquivos: kebab-case

### Estrutura
- Um componente por arquivo
- Lógica de negócio em `/src/game`
- Componentes reutilizáveis em `/src/ui/components`
- Server actions em arquivos `.action.ts`

### Testes
- Unitários para lógica de jogo (engine, regras)
- E2E mínimo para fluxos críticos
- Sem testes de componentes visuais

## Configurações Padrão

### Jogo
- Velocidade de simulação: 100ms por minuto de jogo
- Dificuldade: Normal (sem bônus/penalidades)
- Calendário: Fev-Nov (como no Brasil)
- Orçamento inicial: baseado na divisão

### Sistema
- Auto-save: a cada 7 dias do jogo
- Máximo de saves: 10 por perfil
- Timeout de sessão: 30 minutos
- Cache de dados: 5 minutos