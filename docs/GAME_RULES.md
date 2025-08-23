# Regras do Jogo - FootManager 98

## Sistema de Ligas

### Estrutura
- **4 Divisões**: Série A, B, C e D
- **12 clubes** por divisão (48 clubes total)
- Sistema de **pontos corridos** (todos contra todos, ida e volta)
- **22 rodadas** por turno (44 rodadas total)

### Pontuação
- **Vitória**: 3 pontos
- **Empate**: 1 ponto
- **Derrota**: 0 pontos

### Promoção e Rebaixamento
- **Top 3**: Promovidos para divisão superior
- **Bottom 3**: Rebaixados para divisão inferior
- Série A: Apenas rebaixamento
- Série D: Apenas promoção

### Critérios de Desempate
1. Pontos
2. Saldo de gols
3. Gols marcados
4. Ordem alfabética (último critério)

## Sistema de Partidas

### Duração
- **90 minutos** + acréscimos
- Simulação minuto a minuto
- Velocidade: 100ms por minuto simulado

### Fatores que Influenciam
1. **Ratings dos Setores**
   - Defesa (GK + DF)
   - Meio-campo (MF)
   - Ataque (FW)

2. **Modificadores**
   - Fitness dos jogadores (0-100%)
   - Forma atual (0-100%)
   - Moral do time (0-100%)
   - Vantagem de casa (+5% nos ratings)

3. **Táticas**
   - Formação (4-4-2, 4-3-3, 3-5-2, 5-3-2)
   - Agressividade (0-100)
   - Pressão (0-100)
   - Estilo de passes (curto/longo/misto)

### Eventos
- **Gols**: Probabilidade baseada em ataque vs defesa
- **Cartões**: Baseados em agressividade
  - Amarelo: 15% chance em falta
  - Vermelho: 2º amarelo ou entrada violenta
- **Lesões**: 0.1% chance por minuto
- **Substituições**: Ainda não implementadas

## Jogadores

### Atributos
- **Overall**: 1-100 (habilidade geral)
- **Fitness**: 0-100% (condição física)
- **Form**: 0-100% (forma atual)
- **Morale**: 0-100% (motivação)
- **Age**: 17-40 anos
- **Position**: GK, DF, MF, FW

### Contratos
- Duração: 1-4 anos
- Salário semanal baseado no overall
- Multa rescisória automática

### Suspensões
- **5 amarelos** = 1 jogo suspenso
- **Vermelho direto** = 1 jogo suspenso
- **2º amarelo** = 1 jogo suspenso

### Lesões
- Duração: 3-21 dias
- Tipos: muscular, fratura, entorse
- Jogador não pode ser escalado

## Sistema Financeiro

### Receitas
- **Bilheteria**: §50 por torcedor
- **Público**: 70% da capacidade (fixo)
- **Patrocínio**: Baseado na divisão
  - Série A: §100k/temporada
  - Série B: §50k/temporada
  - Série C: §25k/temporada
  - Série D: §10k/temporada
- **Vendas de jogadores**

### Despesas
- **Salários**: Pagos semanalmente
- **Compras de jogadores**
- **Manutenção**: §10k/semana (fixo)

### Orçamento Inicial
- Série A: §5M - §20M
- Série B: §2M - §8M
- Série C: §500k - §3M
- Série D: §100k - §1M

## Mercado de Transferências

### Janelas
- **Verão**: Julho-Agosto
- **Inverno**: Janeiro

### Preços
Calculados com base em:
- Overall do jogador
- Idade (pico aos 24-28)
- Tempo de contrato restante
- Moral do jogador

### Regras
- Mínimo 18 jogadores no elenco
- Máximo 30 jogadores
- Jogadores lesionados podem ser vendidos

## Calendário

### Temporada
- **Início**: Fevereiro
- **Fim**: Novembro
- **Duração**: 10 meses

### Jogos
- **Fins de semana**: Sábado e Domingo
- **Horário**: 16:00
- **Frequência**: 1 rodada por semana

## Táticas e Formações

### Formações Disponíveis
1. **4-4-2**: Balanceada
2. **4-3-3**: +10% ataque, -5% meio
3. **3-5-2**: +10% meio, -10% defesa
4. **5-3-2**: +15% defesa, -10% ataque

### Sliders Táticos
- **Agressividade** (0-100)
  - Alta: +20% ataque, -20% defesa, +cartões
  - Baixa: +10% defesa, -10% ataque, -cartões

- **Pressão** (0-100)
  - Alta: +10% meio, +fitness gasto
  - Baixa: Normal

## Progressão

### Jogadores
- Overall pode variar ±5 por temporada
- Pico de performance: 24-28 anos
- Declínio após 30 anos
- Form varia com performances
- Morale afetada por:
  - Resultados do time
  - Salário vs expectativa
  - Tempo de jogo

### Time
- Promoção aumenta orçamento
- Rebaixamento reduz orçamento
- Títulos aumentam patrocínio

## Limitações Atuais

### Não Implementado (MVP)
- Copa nacional
- Competições internacionais
- Categorias de base
- Scouts
- Estádio upgrades
- Variação de público
- Clima afetando partidas
- Rivalidades

### Simplificações
- Público fixo em 70%
- Sem variação de preços de ingresso
- Patrocínio fixo por divisão
- Sem negociação de contratos
- Sem cláusulas especiais