'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TutorialStep {
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao FootManager 98!',
    content: 'Este é um jogo de gerenciamento de futebol onde você controla um clube e tenta levá-lo ao topo! Vamos começar o tutorial.'
  },
  {
    title: 'Navegação do Jogo',
    content: 'Use o menu lateral esquerdo para navegar entre as diferentes seções do jogo. Cada ícone representa uma área diferente.',
    target: 'sidebar',
    position: 'right'
  },
  {
    title: 'Ações Principais',
    content: 'Aqui estão os botões mais importantes! Use "AVANÇAR 1 DIA" para passar o tempo e "JOGAR PRÓXIMA PARTIDA" quando houver jogo.',
    target: 'quick-actions',
    position: 'top'
  },
  {
    title: 'Informações do Time',
    content: 'Acompanhe a situação do seu clube, posição na tabela e próximos jogos nesta área.',
    target: 'team-info',
    position: 'bottom'
  },
  {
    title: 'Atalhos de Teclado',
    content: 'Pressione "?" a qualquer momento para ver os atalhos de teclado. Use H para Home, E para Elenco, T para Táticas, etc.',
  },
  {
    title: 'Dicas Finais',
    content: 'Mantenha suas finanças saudáveis, treine seus jogadores regularmente e ajuste suas táticas para cada adversário. Boa sorte!'
  }
]

export function TutorialOverlay() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    if (!hasSeenTutorial) {
      setIsActive(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setIsActive(false)
    localStorage.setItem('hasSeenTutorial', 'true')
  }

  if (!isMounted || !isActive) return null

  const step = TUTORIAL_STEPS[currentStep]

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-40" onClick={handleClose} />
      
      {/* Tutorial Card */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white border-4 border-black max-w-md w-full p-6 relative">
          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 ${
                  index <= currentStep ? 'bg-retro-blue' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold mb-4 font-mono">{step.title}</h2>
          <p className="mb-6 text-lg">{step.content}</p>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`btn-retro ${currentStep === 0 ? 'opacity-50' : ''}`}
            >
              ANTERIOR
            </button>

            <span className="font-mono text-sm">
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </span>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'COMEÇAR' : 'PRÓXIMO'}
            </button>
          </div>

          {/* Skip button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
            title="Pular tutorial"
          >
            ✕
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// Hook to manually trigger tutorial
export function useRestartTutorial() {
  return () => {
    localStorage.removeItem('hasSeenTutorial')
    window.location.reload()
  }
}