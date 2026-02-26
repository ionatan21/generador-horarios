import { TimeRange } from './TimeRange'

/**
 * TimeSlot — represents a fixed 50-minute academic slot that starts on the hour.
 * Encapsulates the app's convention: classes run from HH:00 to HH:50.
 */
export class TimeSlot {
  static readonly DURATION_MINUTES = 50

  /** All valid academic slots from 07:00 to 22:00. */
  static readonly ALL: readonly TimeSlot[] = Array.from(
    { length: 16 },
    (_, i) => new TimeSlot(i + 7),
  )

  readonly range: TimeRange

  constructor(startHour: number) {
    if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
      throw new Error(`Invalid start hour: ${startHour}`)
    }
    const pad = (n: number) => String(n).padStart(2, '0')
    this.range = new TimeRange(`${pad(startHour)}:00`, `${pad(startHour)}:50`)
  }

  get start(): string { return this.range.start }
  get end(): string   { return this.range.end }

  toString(): string  { return this.range.toString() }

  /** Returns the TimeSlot whose start matches the given "HH:MM" string, or null. */
  static fromStart(start: string): TimeSlot | null {
    return TimeSlot.ALL.find((s) => s.start === start) ?? null
  }
}
