'use client'

import { useState } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { SaveInfo } from '@/src/game/save/save-manager'
import dayjs from 'dayjs'
import { saveGame, loadGame, deleteSave } from '@/app/game/actions'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/src/ui/components/ConfirmDialog'

interface SavesViewProps {
  saves: SaveInfo[]
  managerId: string
}

export function SavesView({ saves, managerId }: SavesViewProps) {
  const [saveName, setSaveName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saveToDelete, setSaveToDelete] = useState<SaveInfo | null>(null)
  const { currentDate } = useGameStore()
  const router = useRouter()

  const handleSave = async () => {
    if (!saveName.trim()) {
      setMessage({ type: 'error', text: 'Digite um nome para o save' })
      return
    }

    setLoading(true)
    const result = await saveGame(managerId, saveName, currentDate)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Jogo salvo com sucesso!' })
      setSaveName('')
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar' })
    }
    
    setLoading(false)
  }

  const handleLoad = async (saveId: string) => {
    if (!confirm('Tem certeza? O progresso atual não salvo será perdido.')) {
      return
    }

    setLoading(true)
    const result = await loadGame(saveId)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Jogo carregado com sucesso!' })
      // Refresh the page to load new state
      window.location.reload()
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao carregar' })
    }
    
    setLoading(false)
  }

  const handleDelete = (save: SaveInfo) => {
    setSaveToDelete(save)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!saveToDelete) return

    setLoading(true)
    const result = await deleteSave(saveToDelete.id)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Save excluído!' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao excluir' })
    }
    
    setLoading(false)
    setShowDeleteConfirm(false)
    setSaveToDelete(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">SALVAR/CARREGAR</h1>

      {/* Save Game */}
      <div className="card-retro">
        <h2 className="font-mono text-lg mb-4">SALVAR JOGO</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Nome do save"
            className="input-retro flex-1"
            disabled={loading}
          />
          <button
            onClick={handleSave}
            disabled={loading || !saveName.trim()}
            className="btn-primary"
          >
            SALVAR
          </button>
        </div>
        
        {message && (
          <div className={`mt-2 text-sm ${
            message.type === 'success' ? 'text-retro-green' : 'text-retro-red'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Load Game */}
      <div className="card-retro">
        <h2 className="font-mono text-lg mb-4">CARREGAR JOGO</h2>
        
        {saves.length === 0 ? (
          <p className="text-gray-500">Nenhum save encontrado</p>
        ) : (
          <div className="space-y-2">
            {saves.map((save) => (
              <div
                key={save.id}
                className="border border-black p-3 flex items-center justify-between hover:bg-retro-gray"
              >
                <div className="flex-1">
                  <div className="font-bold">
                    {save.name}
                    {save.isAutoSave && (
                      <span className="text-sm text-gray-500 ml-2">[AUTO]</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {save.clubName} - Temporada {save.seasonYear}
                  </div>
                  <div className="text-xs text-gray-500">
                    Data do jogo: {dayjs(save.gameDate).format('DD/MM/YYYY')} | 
                    Salvo em: {dayjs(save.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(save.id)}
                    disabled={loading}
                    className="btn-retro text-sm"
                  >
                    CARREGAR
                  </button>
                  <button
                    onClick={() => handleDelete(save)}
                    disabled={loading}
                    className="btn-danger text-sm"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-save Info */}
      <div className="card-retro">
        <h3 className="font-mono text-sm mb-2">INFORMAÇÕES</h3>
        <ul className="text-sm space-y-1">
          <li>• O jogo salva automaticamente a cada 7 dias</li>
          <li>• Máximo de 3 auto-saves por perfil</li>
          <li>• Saves manuais não têm limite</li>
          <li>• Os saves são salvos em /saves e no banco de dados</li>
        </ul>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="EXCLUIR SAVE"
        message={`Tem certeza que deseja excluir o save "${saveToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="EXCLUIR"
        cancelText="CANCELAR"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setSaveToDelete(null)
        }}
        danger={true}
      />
    </div>
  )
}