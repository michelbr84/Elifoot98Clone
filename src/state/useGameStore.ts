import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Manager, Club, Season } from '@prisma/client'

interface GameState {
  // Current game state
  currentManager: Manager | null
  currentClub: Club | null
  currentSeason: Season | null
  currentDate: Date
  
  // UI state
  isLoading: boolean
  isSimulating: boolean
  selectedView: 'home' | 'squad' | 'lineup' | 'tactics' | 'fixtures' | 'table' | 'all-divisions' | 'transfers' | 'training' | 'finance' | 'news' | 'saves' | 'settings'
  
  // Manager fired state
  isManagerFired: boolean
  
  // Actions
  setCurrentManager: (manager: Manager | null) => void
  setCurrentClub: (club: Club | null) => void
  setCurrentSeason: (season: Season | null) => void
  setCurrentDate: (date: Date) => void
  setLoading: (loading: boolean) => void
  setSimulating: (simulating: boolean) => void
  setSelectedView: (view: GameState['selectedView']) => void
  setManagerFired: (fired: boolean) => void
  reset: () => void
}

const initialState = {
  currentManager: null,
  currentClub: null,
  currentSeason: null,
  currentDate: new Date(),
  isLoading: false,
  isSimulating: false,
  selectedView: 'home' as const,
  isManagerFired: false,
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setCurrentManager: (manager) => set({ currentManager: manager }),
      setCurrentClub: (club) => set({ currentClub: club }),
      setCurrentSeason: (season) => set({ currentSeason: season }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSimulating: (simulating) => set({ isSimulating: simulating }),
      setSelectedView: (view) => set({ selectedView: view }),
      setManagerFired: (fired) => set({ isManagerFired: fired }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'footmanager-game-state',
      partialize: (state) => ({
        // Only persist game state, not UI state
        currentManager: state.currentManager,
        currentClub: state.currentClub,
        currentSeason: state.currentSeason,
        currentDate: state.currentDate,
      }),
    }
  )
)