import { PrismaClient } from '@prisma/client'
import seedrandom from 'seedrandom'
import dayjs from 'dayjs'
import { CalendarGenerator } from '../src/game/rules/calendar-generator'

const prisma = new PrismaClient()

// Initialize seeded random number generator
const seed = process.env.NEXT_PUBLIC_SEED || 'footmanager98'
const rng = seedrandom(seed)

// Helper functions
const random = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) => rng() * (max - min) + min
const pick = <T>(array: T[]): T => array[Math.floor(rng() * array.length)]

// Name generation data
const firstNames = [
  'João', 'Pedro', 'Carlos', 'José', 'Paulo', 'Lucas', 'Felipe', 'Bruno',
  'Rafael', 'Diego', 'Marcos', 'André', 'Luis', 'Ricardo', 'Fernando',
  'Roberto', 'Daniel', 'Gustavo', 'Eduardo', 'Rodrigo', 'Thiago', 'Mateus',
  'Leonardo', 'Gabriel', 'Alexandre', 'Marcelo', 'Antonio', 'Francisco',
  'Sergio', 'Miguel', 'David', 'Jorge', 'Alberto', 'Victor', 'Samuel'
]

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira',
  'Rodrigues', 'Almeida', 'Nascimento', 'Pereira', 'Carvalho', 'Araújo',
  'Ribeiro', 'Martins', 'Gonçalves', 'Soares', 'Barbosa', 'Vieira',
  'Fernandes', 'Gomes', 'Dias', 'Moreira', 'Nunes', 'Mendes', 'Cardoso',
  'Rocha', 'Teixeira', 'Machado', 'Campos', 'Monteiro', 'Correia'
]

const clubPrefixes = ['FC', 'SC', 'EC', 'AC', 'Clube', 'Sport', 'Atlético']
const clubNames = [
  'Unidos', 'Victoria', 'Progresso', 'Liberdade', 'Esperança', 'Juventude',
  'Industrial', 'Comercial', 'Nacional', 'Internacional', 'Popular',
  'Operário', 'Ferroviário', 'Metropolitano', 'Central', 'Real', 'Imperial'
]

const cities = [
  'São Carlos', 'Porto Feliz', 'Nova Lima', 'Bela Vista', 'Campo Grande',
  'Vila Rica', 'Jardim Alegre', 'Monte Alto', 'Rio Claro', 'Santa Cruz',
  'Três Lagoas', 'Ponta Verde', 'Serra Dourada', 'Vale do Sol', 'Águas Claras'
]

const stadiumNames = [
  'Estádio Municipal', 'Arena Central', 'Estádio do Vale', 'Campo dos Sonhos',
  'Estádio da Colina', 'Arena Nova', 'Estádio do Povo', 'Campo Verde'
]

const nationalities = ['Brasil', 'Argentina', 'Uruguai', 'Paraguai', 'Chile', 'Colômbia']

// Generate club name
function generateClubName(): { name: string; shortName: string } {
  const prefix = pick(clubPrefixes)
  const clubName = pick(clubNames)
  const city = pick(cities)
  
  const fullName = `${prefix} ${clubName} de ${city}`
  const shortName = clubName.substring(0, 3).toUpperCase()
  
  return { name: fullName, shortName }
}

// Generate player name
function generatePlayerName(): string {
  const firstName = pick(firstNames)
  const lastName = pick(lastNames)
  return `${firstName} ${lastName}`
}

// Generate player overall based on division level and position
function generatePlayerOverall(divisionLevel: number, position: string): number {
  const baseOverall = {
    1: { min: 55, max: 85, mean: 70 }, // Serie A
    2: { min: 45, max: 75, mean: 60 }, // Serie B
    3: { min: 35, max: 65, mean: 50 }, // Serie C
    4: { min: 25, max: 55, mean: 40 }, // Serie D
  }
  
  const config = baseOverall[divisionLevel as keyof typeof baseOverall] || baseOverall[4]
  
  // Use normal distribution
  let overall = Math.round(randomGaussian(config.mean, 10))
  overall = Math.max(config.min, Math.min(config.max, overall))
  
  // Goalkeepers tend to be slightly lower rated
  if (position === 'GK') {
    overall = Math.max(config.min, overall - 3)
  }
  
  return overall
}

// Gaussian random using Box-Muller transform
function randomGaussian(mean: number, stdDev: number): number {
  const u1 = rng()
  const u2 = rng()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

// Calculate player value and wage based on overall and age
function calculatePlayerFinancials(overall: number, age: number) {
  // Base value calculation
  let value = Math.pow(overall / 10, 2.5) * 10000
  
  // Age modifier
  if (age < 24) value *= 1.3
  else if (age > 30) value *= Math.max(0.3, 1 - (age - 30) * 0.1)
  
  // Wage is roughly 1% of value per week
  const wage = Math.round(value * 0.01 / 52)
  
  return {
    value: Math.round(value),
    wage: Math.max(100, Math.round(wage / 100) * 100) // Round to nearest 100
  }
}

async function main() {
  console.log('🌱 Starting seed...')
  
  // Clear existing data
  await prisma.$transaction([
    prisma.matchEvent.deleteMany(),
    prisma.lineup.deleteMany(),
    prisma.match.deleteMany(),
    prisma.fixture.deleteMany(),
    prisma.round.deleteMany(),
    prisma.standing.deleteMany(),
    prisma.training.deleteMany(),
    prisma.injury.deleteMany(),
    prisma.news.deleteMany(),
    prisma.finance.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.transfer.deleteMany(),
    prisma.tactic.deleteMany(),
    prisma.saveSlot.deleteMany(),
    prisma.player.deleteMany(),
    prisma.manager.deleteMany(),
    prisma.club.deleteMany(),
    prisma.division.deleteMany(),
    prisma.season.deleteMany(),
  ])
  
  // Create season
  const currentYear = new Date().getFullYear()
  const season = await prisma.season.create({
    data: {
      year: currentYear,
      startDate: dayjs(`${currentYear}-02-01`).toDate(),
      endDate: dayjs(`${currentYear}-11-30`).toDate(),
      isActive: true,
    }
  })
  
  // Create divisions
  const divisionNames = ['Série A', 'Série B', 'Série C', 'Série D']
  const divisions = []
  
  for (let i = 0; i < 4; i++) {
    const division = await prisma.division.create({
      data: {
        name: divisionNames[i],
        level: i + 1,
        seasonId: season.id,
      }
    })
    divisions.push(division)
  }
  
  // Create clubs and players
  const clubsPerDivision = 12
  const playersPerClub = 20
  const usedClubNames = new Set<string>()
  
  for (const division of divisions) {
    console.log(`Creating clubs for ${division.name}...`)
    
    for (let i = 0; i < clubsPerDivision; i++) {
      // Generate unique club name
      let clubData = generateClubName()
      while (usedClubNames.has(clubData.name)) {
        clubData = generateClubName()
      }
      usedClubNames.add(clubData.name)
      
      // Create club
      const club = await prisma.club.create({
        data: {
          name: clubData.name,
          shortName: clubData.shortName,
          colors: JSON.stringify({
            primary: pick(['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000']),
            secondary: pick(['#FFFFFF', '#000000', '#FFD700', '#C0C0C0'])
          }),
          founded: random(1900, 1980),
          stadium: pick(stadiumNames),
          capacity: random(5000, 40000),
          budget: division.level === 1 ? random(5000000, 20000000) : 
                  division.level === 2 ? random(2000000, 8000000) :
                  division.level === 3 ? random(500000, 3000000) :
                  random(100000, 1000000),
          divisionId: division.id,
        }
      })
      
      // Create players
      const positions = ['GK', 'GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 
                        'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
                        'FW', 'FW', 'FW', 'FW', 'FW']
      
      for (let j = 0; j < playersPerClub; j++) {
        const position = positions[j]
        const age = random(17, 37)
        const overall = generatePlayerOverall(division.level, position)
        const { value, wage } = calculatePlayerFinancials(overall, age)
        
        await prisma.player.create({
          data: {
            name: generatePlayerName(),
            age,
            nationality: pick(nationalities),
            position,
            overall,
            fitness: random(85, 100),
            form: random(40, 60),
            morale: random(40, 60),
            value,
            wage,
            contractEndsAt: dayjs().add(random(1, 4), 'year').toDate(),
            clubId: club.id,
          }
        })
      }
      
      // Create initial standings
      await prisma.standing.create({
        data: {
          seasonId: season.id,
          clubId: club.id,
          position: i + 1,
        }
      })
    }
  }
  
  // Generate fixtures for the season
  console.log('Generating fixtures...')
  const calendarGenerator = new CalendarGenerator(prisma, seed)
  await calendarGenerator.generateSeasonFixtures(season.id)
  
  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })