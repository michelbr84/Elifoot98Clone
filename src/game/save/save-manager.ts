import { PrismaClient } from '@prisma/client'
import { SaveGameSerializer, SaveGameData } from './serializer'
import fs from 'fs/promises'
import path from 'path'

export interface SaveInfo {
  id: string
  name: string
  createdAt: Date
  gameDate: Date
  seasonYear: number
  clubName?: string
  isAutoSave: boolean
}

export class SaveManager {
  private prisma: PrismaClient
  private serializer: SaveGameSerializer
  private savesDir: string

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.serializer = new SaveGameSerializer(prisma)
    this.savesDir = path.join(process.cwd(), 'saves')
  }

  /**
   * Save game to both filesystem and database
   */
  async saveGame(
    managerId: string,
    saveName: string,
    gameDate: Date,
    isAutoSave = false
  ): Promise<string> {
    // Serialize game data
    const saveData = await this.serializer.serialize(managerId, gameDate)

    // Save to filesystem
    const filename = await this.saveToFile(saveData, saveName, isAutoSave)

    // Save to database
    const saveSlot = await this.prisma.saveSlot.create({
      data: {
        managerId,
        name: saveName,
        gameDate,
        seasonYear: saveData.seasonYear,
        data: JSON.stringify(saveData)
      }
    })

    return saveSlot.id
  }

  /**
   * Load game from save
   */
  async loadGame(saveId: string, source: 'db' | 'file' = 'db'): Promise<SaveGameData> {
    if (source === 'db') {
      const saveSlot = await this.prisma.saveSlot.findUnique({
        where: { id: saveId }
      })

      if (!saveSlot) {
        throw new Error('Save not found')
      }

      const saveData = JSON.parse(saveSlot.data) as SaveGameData
      await this.serializer.deserialize(saveData)
      
      return saveData
    } else {
      // Load from file
      const filePath = path.join(this.savesDir, `${saveId}.json`)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const saveData = JSON.parse(fileContent) as SaveGameData
      
      await this.serializer.deserialize(saveData)
      
      return saveData
    }
  }

  /**
   * List available saves
   */
  async listSaves(managerId?: string): Promise<SaveInfo[]> {
    // Get saves from database
    const dbSaves = await this.prisma.saveSlot.findMany({
      where: managerId ? { managerId } : undefined,
      include: {
        manager: {
          include: {
            club: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const saveInfos: SaveInfo[] = dbSaves.map(save => ({
      id: save.id,
      name: save.name,
      createdAt: save.createdAt,
      gameDate: save.gameDate,
      seasonYear: save.seasonYear,
      clubName: save.manager.club?.name,
      isAutoSave: save.name.startsWith('Auto-save')
    }))

    return saveInfos
  }

  /**
   * Delete a save
   */
  async deleteSave(saveId: string): Promise<void> {
    // Delete from database
    await this.prisma.saveSlot.delete({
      where: { id: saveId }
    })

    // Try to delete from filesystem
    try {
      const filePath = path.join(this.savesDir, `${saveId}.json`)
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, ignore
    }
  }

  /**
   * Auto-save functionality
   */
  async autoSave(managerId: string, gameDate: Date): Promise<void> {
    const saveName = `Auto-save ${new Date().toLocaleString('pt-BR')}`
    
    // Delete old auto-saves (keep only last 3)
    const autoSaves = await this.prisma.saveSlot.findMany({
      where: {
        managerId,
        name: {
          startsWith: 'Auto-save'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (autoSaves.length >= 3) {
      const toDelete = autoSaves.slice(3)
      for (const save of toDelete) {
        await this.deleteSave(save.id)
      }
    }

    // Create new auto-save
    await this.saveGame(managerId, saveName, gameDate, true)
  }

  /**
   * Save to filesystem
   */
  private async saveToFile(
    saveData: SaveGameData,
    saveName: string,
    isAutoSave: boolean
  ): Promise<string> {
    // Ensure saves directory exists
    await fs.mkdir(this.savesDir, { recursive: true })

    // Generate filename
    const timestamp = new Date().getTime()
    const sanitizedName = saveName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${isAutoSave ? 'auto_' : ''}${sanitizedName}_${timestamp}.json`
    const filepath = path.join(this.savesDir, filename)

    // Write file
    await fs.writeFile(filepath, JSON.stringify(saveData, null, 2), 'utf-8')

    return filename
  }

  /**
   * Export save to downloadable format
   */
  async exportSave(saveId: string): Promise<Buffer> {
    const saveSlot = await this.prisma.saveSlot.findUnique({
      where: { id: saveId }
    })

    if (!saveSlot) {
      throw new Error('Save not found')
    }

    return Buffer.from(saveSlot.data, 'utf-8')
  }

  /**
   * Import save from uploaded file
   */
  async importSave(
    managerId: string,
    saveName: string,
    saveData: SaveGameData
  ): Promise<string> {
    // Validate save data
    if (!saveData.version || !saveData.manager) {
      throw new Error('Invalid save file')
    }

    // Create new save slot
    const saveSlot = await this.prisma.saveSlot.create({
      data: {
        managerId,
        name: `${saveName} (Imported)`,
        gameDate: new Date(saveData.gameDate),
        seasonYear: saveData.seasonYear,
        data: JSON.stringify(saveData)
      }
    })

    return saveSlot.id
  }
}