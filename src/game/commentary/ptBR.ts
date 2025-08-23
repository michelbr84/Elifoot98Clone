export interface CommentaryEvent {
  type: 'kickoff' | 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 
        'injury' | 'chance' | 'save' | 'offside' | 'foul' | 'corner' | 
        'penalty' | 'half_time' | 'full_time' | 'general'
  minute: number
  player?: string
  player2?: string // For substitutions
  team?: string
  detail?: string
}

export class CommentaryPtBR {
  private templates: Record<CommentaryEvent['type'], string[]> = {
    kickoff: [
      'O árbitro apita e a bola está rolando!',
      'Começa o jogo! {team} dá o pontapé inicial.',
      'E lá vamos nós! A partida está em andamento.',
      'Bola rolando! Que vença o melhor!'
    ],
    goal: [
      'GOOOOOL! {player} balança as redes!',
      'É GOL! {player} marca para o {team}!',
      'QUE GOLAÇO! {player} acerta um chute espetacular!',
      'GOL DO {team}! {player} não desperdiça a oportunidade!',
      'ESTÁ LÁ DENTRO! {player} comemora com a torcida!'
    ],
    yellow_card: [
      'Cartão amarelo para {player}!',
      '{player} recebe cartão amarelo por falta dura.',
      'O árbitro adverte {player} com cartão amarelo.',
      'Amarelo para {player}. Ele precisa ter cuidado agora.'
    ],
    red_card: [
      'CARTÃO VERMELHO! {player} está expulso!',
      'É vermelho! {player} deixa o campo mais cedo.',
      'Expulsão! {player} complica a vida do {team}.',
      'Cartão vermelho direto! {player} exagerou na entrada.'
    ],
    substitution: [
      'Substituição no {team}: sai {player}, entra {player2}.',
      'Mudança no {team}! {player2} entra no lugar de {player}.',
      '{team} faz alteração: {player} dá lugar a {player2}.',
      'Mexida no time! {player2} substitui {player}.'
    ],
    injury: [
      '{player} sente dores e preocupa o banco.',
      'Problema físico! {player} está no chão.',
      '{player} parece ter sentido a coxa.',
      'Lesão! {player} não consegue continuar.'
    ],
    chance: [
      'Que chance! {player} perde oportunidade incrível!',
      '{player} desperdiça grande chance para o {team}!',
      'Quase! A bola passa raspando a trave!',
      'Por pouco! {player} manda a bola por cima do gol!',
      'Inacreditável! {player} perde gol feito!'
    ],
    save: [
      'Que defesa! O goleiro do {team} faz milagre!',
      'DEFESAÇA! O arqueiro evita o gol!',
      'Espetacular! Grande defesa do goleiro!',
      'O goleiro salva o {team} com defesa impressionante!'
    ],
    offside: [
      'Impedido! {player} estava adiantado.',
      'O bandeirinha marca impedimento de {player}.',
      'Posição irregular! {player} em impedimento.',
      'Anulado! {player} estava em posição de impedimento.'
    ],
    foul: [
      'Falta marcada! {player} derruba o adversário.',
      '{player} comete falta no meio-campo.',
      'O árbitro marca falta de {player}.',
      'Infração! {player} para o contra-ataque com falta.'
    ],
    corner: [
      'Escanteio para o {team}!',
      'A bola sai pela linha de fundo. É córner para o {team}.',
      '{team} terá oportunidade no escanteio.',
      'Bola na área! Escanteio para o {team}.'
    ],
    penalty: [
      'PÊNALTI! O árbitro aponta para a marca da cal!',
      'É pênalti para o {team}!',
      'Penalidade máxima! Grande chance para o {team}!',
      'O juiz não hesita: PÊNALTI!'
    ],
    half_time: [
      'O árbitro apita o fim do primeiro tempo!',
      'Intervalo! Os times vão para o vestiário.',
      'Termina a primeira etapa!',
      'Fim dos primeiros 45 minutos!'
    ],
    full_time: [
      'FIM DE JOGO! O árbitro encerra a partida!',
      'Apita o árbitro! Está encerrado o jogo!',
      'É o fim! A partida chega ao seu final!',
      'Termina aqui! Os 90 minutos se esgotaram!'
    ],
    general: [
      'O jogo está equilibrado no meio-campo.',
      'As equipes estudam o adversário neste momento.',
      'Muita disputa no meio-campo.',
      'O ritmo da partida diminui um pouco.',
      'Os times trocam passes no meio-campo.',
      'A torcida empurra o time da casa!',
      'Pressão do {team} em busca do gol!',
      'O {team} tenta organizar uma jogada.',
      'Momento de respirar para as duas equipes.'
    ]
  }

  /**
   * Generate commentary for an event
   */
  generateCommentary(event: CommentaryEvent): string {
    const templates = this.templates[event.type]
    if (!templates || templates.length === 0) {
      return `[${event.minute}'] Acontecimento no jogo.`
    }

    // Pick a random template
    const template = templates[Math.floor(Math.random() * templates.length)]

    // Replace placeholders
    let commentary = template
      .replace('{player}', event.player || 'Jogador')
      .replace('{player2}', event.player2 || 'Substituto')
      .replace('{team}', event.team || 'Time')

    // Add minute
    return `[${event.minute}'] ${commentary}`
  }

  /**
   * Generate pre-match commentary
   */
  generatePreMatch(homeTeam: string, awayTeam: string): string[] {
    return [
      `Bem-vindos à partida entre ${homeTeam} e ${awayTeam}!`,
      'Os times já estão em campo, prontos para o início do jogo.',
      'A torcida da casa faz festa nas arquibancadas!',
      'Tudo pronto para mais um grande espetáculo do futebol!'
    ]
  }

  /**
   * Generate post-match commentary
   */
  generatePostMatch(
    homeTeam: string, 
    awayTeam: string, 
    homeScore: number, 
    awayScore: number
  ): string[] {
    const comments: string[] = []

    if (homeScore > awayScore) {
      comments.push(
        `Vitória do ${homeTeam} por ${homeScore} a ${awayScore}!`,
        'A torcida da casa comemora o resultado!',
        'Três pontos importantes para o time mandante.'
      )
    } else if (awayScore > homeScore) {
      comments.push(
        `Vitória do ${awayTeam} por ${awayScore} a ${homeScore}!`,
        'Grande resultado fora de casa!',
        'O time visitante leva os três pontos.'
      )
    } else {
      comments.push(
        `Empate em ${homeScore} a ${awayScore}!`,
        'As equipes dividem os pontos.',
        'Resultado justo pelo que foi apresentado em campo.'
      )
    }

    comments.push('Foi um prazer acompanhar esta partida com vocês!')
    
    return comments
  }

  /**
   * Generate score update commentary
   */
  generateScoreUpdate(
    homeTeam: string, 
    awayTeam: string, 
    homeScore: number, 
    awayScore: number
  ): string {
    return `PLACAR: ${homeTeam} ${homeScore} x ${awayScore} ${awayTeam}`
  }
}