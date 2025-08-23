# Formato de Saves

O FootManager 98 utiliza um sistema duplo de saves: arquivos JSON no filesystem e registros no banco de dados.

## Estrutura do Save

```typescript
interface SaveGameData {
  version: string           // Versão do formato (atualmente "1.0.0")
  createdAt: string        // ISO timestamp de quando foi salvo
  gameDate: string         // ISO timestamp da data no jogo
  seasonYear: number       // Ano da temporada atual
  
  manager: {
    id: string
    name: string
    clubId: string
  }
  
  clubState: {
    budget: number         // Orçamento atual em §
    divisionId: string     // ID da divisão atual
    position: number       // Posição na tabela
  }
  
  players: Array<{
    id: string
    overall: number        // 1-100
    fitness: number        // 0-100
    form: number          // 0-100
    morale: number        // 0-100
    isInjured: boolean
    injuryDays: number
    banMatches: number
    goalsSeason: number
    assistsSeason: number
    yellowCards: number
    redCards: number
  }>
  
  standings: Array<{
    clubId: string
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
    position: number
  }>
  
  completedFixtures: string[]  // IDs das partidas já jogadas
}
```

## Localização dos Arquivos

### Filesystem
- Diretório: `/saves`
- Formato do nome: `[auto_]<nome_sanitizado>_<timestamp>.json`
- Exemplo: `meu_save_1234567890.json`
- Auto-saves: `auto_save_1234567890.json`

### Banco de Dados
- Tabela: `SaveSlot`
- Campos principais:
  - `id`: ID único do save
  - `managerId`: ID do manager
  - `name`: Nome do save
  - `gameDate`: Data no jogo
  - `seasonYear`: Ano da temporada
  - `data`: JSON completo do save

## Auto-saves

- Frequência: A cada 7 dias do jogo
- Limite: 3 auto-saves por manager
- Rotação: Auto-saves antigos são deletados automaticamente
- Nomenclatura: "Auto-save DD/MM/YYYY HH:MM:SS"

## Compatibilidade

- Saves são versionados (`version: "1.0.0"`)
- Saves incompatíveis geram erro ao carregar
- Futuras versões podem incluir migração automática

## Exemplo de Save

```json
{
  "version": "1.0.0",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "gameDate": "2024-03-15T00:00:00.000Z",
  "seasonYear": 2024,
  "manager": {
    "id": "clr1234567890",
    "name": "José Silva",
    "clubId": "clr0987654321"
  },
  "clubState": {
    "budget": 5000000,
    "divisionId": "clr1111111111",
    "position": 5
  },
  "players": [
    {
      "id": "clr2222222222",
      "overall": 75,
      "fitness": 85,
      "form": 60,
      "morale": 70,
      "isInjured": false,
      "injuryDays": 0,
      "banMatches": 0,
      "goalsSeason": 10,
      "assistsSeason": 5,
      "yellowCards": 2,
      "redCards": 0
    }
  ],
  "standings": [
    {
      "clubId": "clr0987654321",
      "played": 10,
      "won": 5,
      "drawn": 3,
      "lost": 2,
      "goalsFor": 15,
      "goalsAgainst": 8,
      "points": 18,
      "position": 5
    }
  ],
  "completedFixtures": [
    "clr3333333333",
    "clr4444444444"
  ]
}
```

## Limitações

- Tamanho máximo: 10MB por save
- Não salva: replays de partidas, histórico de eventos
- Estados temporários (animações, UI) não são salvos

## Import/Export

- Export: Download direto do JSON
- Import: Upload de arquivo JSON válido
- Validação: Estrutura e versão são verificadas