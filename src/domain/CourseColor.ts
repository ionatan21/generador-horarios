/**
 * CourseColor — value object that wraps a CSS hex color string.
 * Validates format and provides preset palette.
 */
export class CourseColor {
  static readonly PRESETS: readonly string[] = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]

  readonly hex: string

  constructor(hex: string) {
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
      throw new Error(`Invalid color hex: "${hex}"`)
    }
    this.hex = hex.toLowerCase()
  }

  equals(other: CourseColor): boolean {
    return this.hex === other.hex
  }

  toString(): string {
    return this.hex
  }

  /** Returns the first preset or a custom CourseColor from any hex string. */
  static fromHex(hex: string): CourseColor {
    return new CourseColor(hex)
  }

  static get default(): CourseColor {
    return new CourseColor(CourseColor.PRESETS[0])
  }
}
