# Arquitetura do FootManager 98

## Visão Geral

O FootManager 98 é construído como uma aplicação web moderna usando Next.js 14 com App Router, combinando Server Components e Client Components para otimizar performance e experiência do usuário.

## Stack Tecnológica

### Frontend
- **Next.js 14** (App Router)
- **React 18** com Server Components
- **TypeScript** para type safety
- **Tailwind CSS** para estilização
- **Zustand** para estado global no cliente
- **Radix UI** para componentes acessíveis

### Backend
- **Server Actions** para mutações
- **Prisma ORM** para acesso ao banco
- **SQLite** (desenvolvimento) / PostgreSQL (produção)

### Ferramentas
- **Vitest** para testes unitários
- **Playwright** para testes E2E
- **ESLint + Prettier** para qualidade de código
- **Husky** para git hooks

## Arquitetura de Camadas

```
┌─────────────────────────────────────────────┐
│          Presentation Layer (UI)            │
│  - React Components (app/)                  │
│  - Client State (Zustand)                   │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Application Layer                    │
│  - Server Actions (app/game/actions.ts)     │
│  - Business Logic Orchestration             │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│          Domain Layer                        │
│  - Game Engine (src/game/engine/)          │
│  - Business Rules (src/game/rules/)        │
│  - Save System (src/game/save/)            │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Data Layer                          │
│  - Prisma ORM                              │
│  - Database (SQLite/PostgreSQL)            │
│  - File System (saves/)                    │
└─────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Match Engine (`src/game/engine/`)

O coração do jogo, responsável por simular partidas:

- **RNG.ts**: Sistema de números aleatórios determinísticos
- **ratings.ts**: Cálculo de ratings dos times
- **match-engine.ts**: Simulação minuto a minuto
- **commentary/**: Sistema de comentários multi-idioma

**Fluxo de Simulação:**
1. Cálculo de ratings base dos times
2. Aplicação de modificadores táticos
3. Simulação minuto a minuto com eventos probabilísticos
4. Geração de comentários para cada evento
5. Atualização de estatísticas

### 2. Calendar System (`src/game/rules/`)

Gerencia o calendário de jogos:

- **calendar-generator.ts**: Algoritmo round-robin
- **standings.ts**: Atualização de classificação

### 3. Save System (`src/game/save/`)

Sistema duplo de persistência:

- **serializer.ts**: Serialização do estado do jogo
- **save-manager.ts**: Gerenciamento de saves (DB + filesystem)

### 4. UI Components (`src/ui/components/`)

Componentes reutilizáveis:

- **GameLayout**: Layout principal com menu
- **Views**: Home, Squad, Table, Saves, etc.

## Fluxo de Dados

### 1. Estado do Cliente (Zustand)

```typescript
interface GameState {
  currentManager: Manager | null
  currentClub: Club | null
  currentSeason: Season | null
  currentDate: Date
  selectedView: string
  // ...
}
```

### 2. Server Actions

Todas as mutações passam por Server Actions:

- `startNewGame()`: Cria novo jogo
- `advanceDay()`: Avança o tempo
- `playNextMatch()`: Simula próxima partida
- `saveGame()`: Salva o jogo
- `loadGame()`: Carrega um save

### 3. Persistência

**Banco de Dados (Prisma)**:
- Estado completo do jogo
- Relacionamentos entre entidades
- Histórico de partidas

**File System**:
- Saves em JSON (`/saves`)
- Backup dos saves do banco

## Decisões de Design

### 1. Server Components por Padrão

- Melhor performance inicial
- SEO otimizado
- Menos JavaScript no cliente

### 2. Estado Híbrido

- **Servidor**: Source of truth (banco de dados)
- **Cliente**: Estado UI temporário (Zustand)

### 3. Determinismo

- Seeds para RNG garantem reprodutibilidade
- Importante para saves e debugging

### 4. Modularidade

- Engine separado da UI
- Fácil adicionar novos idiomas
- Sistema de saves extensível

## Segurança

### 1. Validação

- Zod schemas para validação de dados
- Sanitização de inputs

### 2. Autorização

- Manager ID validado em todas as ações
- Proteção contra manipulação de saves

## Performance

### 1. Otimizações

- Lazy loading de componentes pesados
- Caching de dados estáticos
- Transações de banco otimizadas

### 2. Limites

- Máximo 4 managers por jogo
- Saves limitados a 10MB
- Auto-saves limitados a 3

## Extensibilidade

### Pontos de Extensão

1. **Novos Idiomas**: Adicionar arquivo em `i18n/`
2. **Novas Táticas**: Extender `match-engine.ts`
3. **Novos Eventos**: Adicionar em `MatchEvent` types
4. **Novos Relatórios**: Criar views em `app/game/`

### Padrões para Extensão

- Seguir estrutura existente
- Adicionar testes para novas features
- Documentar decisões em `ASSUMPTIONS.md`