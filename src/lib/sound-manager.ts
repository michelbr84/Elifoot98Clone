export class SoundManager {
  private static instance: SoundManager
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled: boolean = true

  private constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      this.initializeContext()
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  private async initializeContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Load sounds
      await this.loadSounds()
      
      // Check if sounds are enabled in settings
      const settings = localStorage.getItem('gameSettings')
      if (settings) {
        const parsed = JSON.parse(settings)
        this.enabled = parsed.soundEnabled ?? true
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  private async loadSounds() {
    // We'll use generated sounds instead of loading files
    this.sounds.set('click', await this.generateClickSound())
    this.sounds.set('success', await this.generateSuccessSound())
    this.sounds.set('goal', await this.generateGoalSound())
    this.sounds.set('whistle', await this.generateWhistleSound())
    this.sounds.set('error', await this.generateErrorSound())
  }

  private async generateClickSound(): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 })
    
    const buffer = this.audioContext.createBuffer(1, 4410, 44100) // 0.1 second
    const data = buffer.getChannelData(0)
    
    // Generate a short click sound
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 0.1 * Math.exp(-i / 1000)
    }
    
    return buffer
  }

  private async generateSuccessSound(): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 })
    
    const buffer = this.audioContext.createBuffer(1, 22050, 44100) // 0.5 second
    const data = buffer.getChannelData(0)
    
    // Generate a pleasant success sound (ascending tones)
    for (let i = 0; i < data.length; i++) {
      const frequency = 440 + (i / data.length) * 440 // A4 to A5
      data[i] = Math.sin((2 * Math.PI * frequency * i) / 44100) * 0.2 * Math.exp(-i / 10000)
    }
    
    return buffer
  }

  private async generateGoalSound(): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 })
    
    const buffer = this.audioContext.createBuffer(1, 44100, 44100) // 1 second
    const data = buffer.getChannelData(0)
    
    // Generate a celebration sound (multiple ascending tones)
    for (let i = 0; i < data.length; i++) {
      const t = i / 44100
      const frequency1 = 523.25 // C5
      const frequency2 = 659.25 // E5
      const frequency3 = 783.99 // G5
      
      data[i] = (
        Math.sin(2 * Math.PI * frequency1 * t) * 0.3 +
        Math.sin(2 * Math.PI * frequency2 * t) * 0.3 +
        Math.sin(2 * Math.PI * frequency3 * t) * 0.3
      ) * Math.exp(-t * 2)
    }
    
    return buffer
  }

  private async generateWhistleSound(): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 })
    
    const buffer = this.audioContext.createBuffer(1, 22050, 44100) // 0.5 second
    const data = buffer.getChannelData(0)
    
    // Generate a referee whistle sound
    for (let i = 0; i < data.length; i++) {
      const t = i / 44100
      const frequency = 2093 // C7
      data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * (t < 0.1 ? t * 10 : 1) * (t > 0.4 ? (0.5 - t) * 10 : 1)
    }
    
    return buffer
  }

  private async generateErrorSound(): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 })
    
    const buffer = this.audioContext.createBuffer(1, 11025, 44100) // 0.25 second
    const data = buffer.getChannelData(0)
    
    // Generate a low error sound
    for (let i = 0; i < data.length; i++) {
      const frequency = 110 // A2
      data[i] = Math.sin((2 * Math.PI * frequency * i) / 44100) * 0.3 * Math.exp(-i / 2000)
    }
    
    return buffer
  }

  async play(soundName: string) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) return

    try {
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const buffer = this.sounds.get(soundName)!
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start()
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }
}