import { useCallback, useEffect } from 'react'
import { SoundManager } from '@/src/lib/sound-manager'

export function useSound() {
  const soundManager = SoundManager.getInstance()

  // Initialize sound on mount
  useEffect(() => {
    // Initialize on first user interaction
    const initSound = () => {
      soundManager.play('click').catch(() => {})
      document.removeEventListener('click', initSound)
    }
    document.addEventListener('click', initSound)
    
    return () => {
      document.removeEventListener('click', initSound)
    }
  }, [])

  const playClick = useCallback(() => {
    soundManager.play('click')
  }, [soundManager])

  const playSuccess = useCallback(() => {
    soundManager.play('success')
  }, [soundManager])

  const playGoal = useCallback(() => {
    soundManager.play('goal')
  }, [soundManager])

  const playWhistle = useCallback(() => {
    soundManager.play('whistle')
  }, [soundManager])

  const playError = useCallback(() => {
    soundManager.play('error')
  }, [soundManager])

  return {
    playClick,
    playSuccess,
    playGoal,
    playWhistle,
    playError,
    setEnabled: soundManager.setEnabled.bind(soundManager),
    isEnabled: soundManager.isEnabled.bind(soundManager)
  }
}