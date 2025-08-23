import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ShortcutMap {
  [key: string]: () => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      
      let shortcutKey = key
      if (ctrl) shortcutKey = `ctrl+${shortcutKey}`
      if (shift) shortcutKey = `shift+${shortcutKey}`

      const handler = shortcuts[shortcutKey]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts])
}

export function useGlobalShortcuts() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const managerId = searchParams.get('managerId')

  const shortcuts: ShortcutMap = {
    'h': () => router.push(`/game?managerId=${managerId}&view=home`),
    'e': () => router.push(`/game?managerId=${managerId}&view=squad`),
    't': () => router.push(`/game?managerId=${managerId}&view=tactics`),
    'j': () => router.push(`/game?managerId=${managerId}&view=fixtures`),
    'c': () => router.push(`/game?managerId=${managerId}&view=table`),
    'f': () => router.push(`/game?managerId=${managerId}&view=finance`),
    'n': () => router.push(`/game?managerId=${managerId}&view=news`),
    's': () => router.push(`/game?managerId=${managerId}&view=saves`),
    'escape': () => router.push('/'),
    '?': () => alert(`Atalhos de Teclado:
    
H - Home (Dashboard)
E - Elenco
T - Táticas
J - Jogos
C - Classificação (Tabela)
F - Finanças
N - Notícias
S - Salvar/Carregar
ESC - Menu Principal
? - Ajuda`)
  }

  useKeyboardShortcuts(shortcuts)
}