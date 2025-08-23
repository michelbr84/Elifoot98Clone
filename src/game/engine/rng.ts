import seedrandom from 'seedrandom'

export class RNG {
  private rng: seedrandom.PRNG

  constructor(seed: string) {
    this.rng = seedrandom(seed)
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   */
  random(): number {
    return this.rng()
  }

  /**
   * Returns a random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  /**
   * Returns a random float between min and max
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min
  }

  /**
   * Returns true with the given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.random() < probability
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)]
  }

  /**
   * Weighted random selection
   */
  weighted<T>(choices: Array<{ item: T; weight: number }>): T {
    const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0)
    let random = this.random() * totalWeight

    for (const choice of choices) {
      random -= choice.weight
      if (random <= 0) {
        return choice.item
      }
    }

    return choices[choices.length - 1].item
  }

  /**
   * Normal distribution using Box-Muller transform
   */
  gaussian(mean: number, stdDev: number): number {
    const u1 = this.random()
    const u2 = this.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0 * stdDev + mean
  }
}