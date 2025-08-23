'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/src/ui/components/ConfirmDialog'

interface SettingsViewProps {
  managerId: string
}

export function SettingsView({ managerId }: SettingsViewProps) {
  const router = useRouter()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [simulationSpeed, setSimulationSpeed] = useState('normal')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: Save settings to localStorage or database
    localStorage.setItem('gameSettings', JSON.stringify({
      autoSaveEnabled,
      simulationSpeed,
      soundEnabled
    }))
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResetGame = () => {
    // Redirect to home to start a new game
    router.push('/')
  }

  const handleQuitToMenu = () => {
    router.push('/')
  }

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-6 font-mono">CONFIGURAÇÕES</h2>
        
        {/* Game Settings */}
        <div className="space-y-4 mb-6">
          <h3 className="font-mono text-lg uppercase border-b-2 border-black pb-2">
            Opções de Jogo
          </h3>
          
          <div className="flex items-center justify-between">
            <label className="font-mono">Auto-Save (a cada 7 dias)</label>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="font-mono">Velocidade de Simulação</label>
            <select
              className="select-retro"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(e.target.value)}
            >
              <option value="slow">Lenta</option>
              <option value="normal">Normal</option>
              <option value="fast">Rápida</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="font-mono">Sons (Em breve)</label>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              disabled
              className="w-5 h-5"
            />
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4 mb-6">
          <h3 className="font-mono text-lg uppercase border-b-2 border-black pb-2">
            Exibição
          </h3>
          
          <div className="flex items-center justify-between">
            <label className="font-mono">Tema</label>
            <select className="select-retro" disabled>
              <option>Retro (Padrão)</option>
              <option>Dark Mode (Em breve)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="font-mono">Tamanho da Fonte</label>
            <select className="select-retro" disabled>
              <option>Normal</option>
              <option>Grande</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            className="btn-primary"
            onClick={handleSave}
          >
            SALVAR CONFIGURAÇÕES
          </button>
          {saved && <span className="text-green-600 font-mono self-center">✓ Salvo!</span>}
        </div>
      </div>

      {/* Game Management */}
      <div className="card-retro">
        <h3 className="font-mono text-lg uppercase mb-4">Gerenciar Jogo</h3>
        
        <div className="space-y-2">
          <button
            className="btn-retro w-full"
            onClick={() => router.push(`/game?managerId=${managerId}&view=saves`)}
          >
            SAVES
          </button>
          
          <button
            className="btn-retro w-full"
            onClick={handleQuitToMenu}
          >
            VOLTAR AO MENU
          </button>
          
          <button
            className="btn-danger w-full"
            onClick={() => setShowResetConfirm(true)}
          >
            NOVO JOGO
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="card-retro">
        <h3 className="font-mono text-lg uppercase mb-4">Ajuda</h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>Atalhos de Teclado:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>H - Home</li>
            <li>E - Elenco</li>
            <li>T - Táticas</li>
            <li>J - Jogos</li>
            <li>C - Classificação</li>
            <li>F - Finanças</li>
            <li>N - Notícias</li>
            <li>S - Saves</li>
            <li>ESC - Menu Principal</li>
            <li>? - Ajuda</li>
          </ul>
          
          <p className="mt-4"><strong>Dicas:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• O jogo salva automaticamente a cada 7 dias</li>
            <li>• Mantenha sua situação financeira saudável</li>
            <li>• Treine seus jogadores regularmente</li>
            <li>• Ajuste suas táticas para cada adversário</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="NOVO JOGO"
        message="Tem certeza que deseja iniciar um novo jogo? Seu progresso atual será perdido se não estiver salvo."
        confirmText="NOVO JOGO"
        cancelText="CANCELAR"
        onConfirm={handleResetGame}
        onCancel={() => setShowResetConfirm(false)}
        danger={true}
      />
    </div>
  )
}