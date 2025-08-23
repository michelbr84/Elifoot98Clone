'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { saveTactic } from '@/app/game/actions'
import { useRouter } from 'next/navigation'

interface Tactic {
  formation: string
  aggression: number
  pressure: number
  passingStyle: 'short' | 'long' | 'mixed'
}

const FORMATIONS = [
  { value: '4-4-2', label: '4-4-2 Clássico' },
  { value: '4-3-3', label: '4-3-3 Ofensivo' },
  { value: '3-5-2', label: '3-5-2 Meio-campo' },
  { value: '5-3-2', label: '5-3-2 Defensivo' },
]

export function TacticsView() {
  const { currentManager } = useGameStore()
  const router = useRouter()
  const [tactic, setTactic] = useState<Tactic>({
    formation: '4-4-2',
    aggression: 50,
    pressure: 50,
    passingStyle: 'mixed',
  })
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Carregar tática salva do manager
  useEffect(() => {
    if (currentManager?.tactics) {
      const activeTactic = currentManager.tactics.find(t => t.isActive)
      if (activeTactic) {
        setTactic({
          formation: activeTactic.formation,
          aggression: activeTactic.aggression,
          pressure: activeTactic.pressure,
          passingStyle: activeTactic.passingStyle as 'short' | 'long' | 'mixed',
        })
      }
    }
  }, [currentManager])

  const handleSave = async () => {
    if (!currentManager?.id) return
    
    setIsLoading(true)
    try {
      await saveTactic(currentManager.id, tactic)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch (error) {
      alert('Erro ao salvar tática')
    } finally {
      setIsLoading(false)
    }
  }

  const getFormationDisplay = (formation: string) => {
    const parts = formation.split('-').map(Number)
    return (
      <div className="flex justify-center items-center space-x-2 p-4 bg-green-100 border-2 border-green-800 rounded">
        <div className="text-center">
          <div className="text-xs font-mono mb-1">DEF</div>
          <div className="text-2xl font-bold">{parts[0]}</div>
        </div>
        <div className="text-2xl">-</div>
        <div className="text-center">
          <div className="text-xs font-mono mb-1">MEI</div>
          <div className="text-2xl font-bold">{parts[1]}</div>
        </div>
        <div className="text-2xl">-</div>
        <div className="text-center">
          <div className="text-xs font-mono mb-1">ATA</div>
          <div className="text-2xl font-bold">{parts[2]}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-4 font-mono">TÁTICAS</h2>
        
        {/* Formação */}
        <div className="mb-6">
          <label className="block text-sm font-mono uppercase mb-2">Formação:</label>
          <select 
            className="select-retro w-full"
            value={tactic.formation}
            onChange={(e) => setTactic({ ...tactic, formation: e.target.value })}
          >
            {FORMATIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <div className="mt-4">
            {getFormationDisplay(tactic.formation)}
          </div>
        </div>

        {/* Agressividade */}
        <div className="mb-6">
          <label className="block text-sm font-mono uppercase mb-2">
            Agressividade: {tactic.aggression}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={tactic.aggression}
            onChange={(e) => setTactic({ ...tactic, aggression: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs font-mono mt-1">
            <span>Cauteloso</span>
            <span>Normal</span>
            <span>Agressivo</span>
          </div>
        </div>

        {/* Pressão */}
        <div className="mb-6">
          <label className="block text-sm font-mono uppercase mb-2">
            Pressão: {tactic.pressure}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={tactic.pressure}
            onChange={(e) => setTactic({ ...tactic, pressure: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs font-mono mt-1">
            <span>Baixa</span>
            <span>Média</span>
            <span>Alta</span>
          </div>
        </div>

        {/* Estilo de Passes */}
        <div className="mb-6">
          <label className="block text-sm font-mono uppercase mb-2">Estilo de Passes:</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="passingStyle"
                value="short"
                checked={tactic.passingStyle === 'short'}
                onChange={(e) => setTactic({ ...tactic, passingStyle: e.target.value as 'short' | 'long' | 'mixed' })}
                className="mr-2"
              />
              <span className="font-mono">Passes Curtos (Posse de Bola)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="passingStyle"
                value="long"
                checked={tactic.passingStyle === 'long'}
                onChange={(e) => setTactic({ ...tactic, passingStyle: e.target.value as 'short' | 'long' | 'mixed' })}
                className="mr-2"
              />
              <span className="font-mono">Passes Longos (Contra-ataque)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="passingStyle"
                value="mixed"
                checked={tactic.passingStyle === 'mixed'}
                onChange={(e) => setTactic({ ...tactic, passingStyle: e.target.value as 'short' | 'long' | 'mixed' })}
                className="mr-2"
              />
              <span className="font-mono">Misto (Equilibrado)</span>
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'SALVANDO...' : 'SALVAR TÁTICA'}
          </button>
          {saved && <span className="text-green-600 font-mono self-center">✓ Salvo!</span>}
        </div>
      </div>

      {/* Dicas */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">DICAS</h3>
        <ul className="space-y-1 text-sm">
          <li>• <strong>4-4-2:</strong> Formação equilibrada, boa para iniciantes</li>
          <li>• <strong>4-3-3:</strong> Mais ofensiva, pressão alta no adversário</li>
          <li>• <strong>3-5-2:</strong> Domínio do meio-campo, versátil</li>
          <li>• <strong>5-3-2:</strong> Defensiva, boa contra times fortes</li>
          <li className="mt-2">• <strong>Agressividade:</strong> Alta = mais faltas e cartões</li>
          <li>• <strong>Pressão:</strong> Alta = cansa mais rápido os jogadores</li>
        </ul>
      </div>
    </div>
  )
}