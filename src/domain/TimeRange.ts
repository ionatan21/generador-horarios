/**
 * TimeRange — value object representing a half-open [start, end) interval.
 * Times are stored as "HH:MM" strings for simple lexicographic comparison.
 */
export class TimeRange {
  readonly start: string
  readonly end: string

  constructor(start: string, end: string) {
    if (!TimeRange.isValidFormat(start)) throw new Error(`Invalid start time: "${start}"`)
    if (!TimeRange.isValidFormat(end))   throw new Error(`Invalid end time: "${end}"`)
    if (end <= start) throw new Error(`End "${end}" must be strictly after start "${start}"`)
    this.start = start
    this.end = end
  }

  /**
   * Two ranges overlap when one starts before the other ends.
   * Uses half-open semantics: [start, end).
   */
  overlaps(other: TimeRange): boolean {
    return this.start < other.end && this.end > other.start
  }

  /** True if a "HH:MM" point falls within this range (inclusive start, exclusive end). */
  contains(time: string): boolean {
    return time >= this.start && time < this.end
  }

  /** Duration expressed in whole minutes. */
  durationMinutes(): number {
    const [sh, sm] = this.start.split(':').map(Number)
    const [eh, em] = this.end.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }

  toString(): string {
    return `${this.start}–${this.end}`
  }

  equals(other: TimeRange): boolean {
    return this.start === other.start && this.end === other.end
  }

  private static isValidFormat(t: string): boolean {
    if (!/^\d{2}:\d{2}$/.test(t)) return false
    const [h, m] = t.split(':').map(Number)
    return h >= 0 && h <= 23 && m >= 0 && m <= 59
  }
}
