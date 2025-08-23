import { PrismaClient } from '@prisma/client'

export class NewsGenerator {
  constructor(private prisma: PrismaClient) {}

  async createMatchNews(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        fixture: {
          include: {
            homeClub: true,
            awayClub: true
          }
        }
      }
    })

    if (!match) return

    const { homeClub, awayClub } = match.fixture
    const winner = match.homeScore > match.awayScore ? homeClub :
                   match.awayScore > match.homeScore ? awayClub : null

    // Create match result news
    await this.prisma.news.create({
      data: {
        type: 'match',
        title: winner 
          ? `${winner.name} vence ${winner.id === homeClub.id ? awayClub.name : homeClub.name}`
          : `Empate entre ${homeClub.name} e ${awayClub.name}`,
        content: `${homeClub.name} ${match.homeScore} x ${match.awayScore} ${awayClub.name}. ` +
                 `Público: ${match.attendance.toLocaleString('pt-BR')} torcedores.`,
        clubId: homeClub.id,
        date: new Date()
      }
    })

    // Create news for away team too
    await this.prisma.news.create({
      data: {
        type: 'match',
        title: winner 
          ? `${winner.name} vence ${winner.id === homeClub.id ? awayClub.name : homeClub.name}`
          : `Empate entre ${homeClub.name} e ${awayClub.name}`,
        content: `${homeClub.name} ${match.homeScore} x ${match.awayScore} ${awayClub.name}. ` +
                 `Público: ${match.attendance.toLocaleString('pt-BR')} torcedores.`,
        clubId: awayClub.id,
        date: new Date()
      }
    })
  }

  async createInjuryNews(playerId: string, days: number) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { club: true }
    })

    if (!player) return

    await this.prisma.news.create({
      data: {
        type: 'injury',
        title: `${player.name} sofre lesão`,
        content: `${player.name} do ${player.club?.name} ficará afastado por ${days} dias devido a lesão.`,
        clubId: player.clubId || undefined,
        date: new Date()
      }
    })
  }

  async createSuspensionNews(playerId: string, cardType: 'yellow' | 'red') {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { club: true }
    })

    if (!player) return

    await this.prisma.news.create({
      data: {
        type: 'suspension',
        title: cardType === 'red' 
          ? `${player.name} expulso` 
          : `${player.name} recebe 5º amarelo`,
        content: cardType === 'red'
          ? `${player.name} do ${player.club?.name} foi expulso e cumprirá suspensão automática.`
          : `${player.name} do ${player.club?.name} recebeu o 5º cartão amarelo e está suspenso.`,
        clubId: player.clubId || undefined,
        date: new Date()
      }
    })
  }

  async createTransferNews(transferId: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        player: true,
        fromClub: true,
        toClub: true
      }
    })

    if (!transfer) return

    await this.prisma.news.create({
      data: {
        type: 'transfer',
        title: `${transfer.player.name} transferido para ${transfer.toClub.name}`,
        content: `${transfer.player.name} foi transferido ${
          transfer.fromClub ? `do ${transfer.fromClub.name}` : 'de clube do exterior'
        } para o ${transfer.toClub.name} por § ${transfer.fee.toLocaleString('pt-BR')}.`,
        clubId: transfer.toClubId,
        date: new Date()
      }
    })

    // News for selling club
    if (transfer.fromClub) {
      await this.prisma.news.create({
        data: {
          type: 'transfer',
          title: `${transfer.player.name} vendido ao ${transfer.toClub.name}`,
          content: `${transfer.fromClub.name} vendeu ${transfer.player.name} ao ${
            transfer.toClub.name
          } por § ${transfer.fee.toLocaleString('pt-BR')}.`,
          clubId: transfer.fromClubId!,
          date: new Date()
        }
      })
    }
  }

  async createFinancialNews(clubId: string, type: 'crisis' | 'recovery') {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId }
    })

    if (!club) return

    await this.prisma.news.create({
      data: {
        type: 'finance',
        title: type === 'crisis' 
          ? `${club.name} em crise financeira`
          : `${club.name} recupera saúde financeira`,
        content: type === 'crisis'
          ? `${club.name} enfrenta dificuldades financeiras com saldo negativo.`
          : `${club.name} consegue equilibrar as contas e volta ao azul.`,
        clubId: clubId,
        date: new Date()
      }
    })
  }
}