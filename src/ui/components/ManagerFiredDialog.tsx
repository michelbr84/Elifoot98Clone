'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'

interface SerieDClub {
  id: string
  name: string
}

interface ManagerFiredDialogProps {
  isOpen: boolean
  onClose: () => void
  onClubSelected: (clubId: string) => void
}

export default function ManagerFiredDialog({ isOpen, onClose, onClubSelected }: ManagerFiredDialogProps) {
  const [availableClubs, setAvailableClubs] = useState<SerieDClub[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadAvailableClubs()
    }
  }, [isOpen])

  const loadAvailableClubs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/game/serie-d-clubs')
      if (response.ok) {
        const data = await response.json()
        setAvailableClubs(data.clubs)
        if (data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar clubes da Série D:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClubSelection = () => {
    if (selectedClubId) {
      onClubSelected(selectedClubId)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💼</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Manager Despedido!</h2>
          <p className="text-gray-600">
            Seu time foi eliminado da Série D. Escolha um novo clube para continuar sua carreira.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escolha um novo clube da Série D:
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-2">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta é sua última chance. Se este novo clube também for eliminado da Série D, 
                  você será despedido permanentemente e precisará começar um novo jogo.
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClubSelection}
                disabled={!selectedClubId}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Aceitar Novo Clube
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
