import type { Day } from './types'
import { TimeRange } from './TimeRange'
import { CourseColor } from './CourseColor'

/**
 * Course — the core aggregate of the domain.
 * Immutable after construction; use `.with()` to produce modified copies.
 */
export class Course {
  readonly id: string
  readonly name: string
  readonly days: readonly Day[]
  readonly timeRange: TimeRange
  readonly color: CourseColor

  constructor(
    name: string,
    days: readonly Day[],
    timeRange: TimeRange,
    color: CourseColor,
    id?: string,
  ) {
    if (!name.trim())      throw new Error('Course name cannot be empty.')
    if (days.length === 0) throw new Error('A course must have at least one day.')
    this.name      = name
    this.days      = days
    this.timeRange = timeRange
    this.color     = color
    this.id        = id ?? crypto.randomUUID()
  }

  /**
   * Returns true when this course is scheduled on the given day
   * AND its time range overlaps with the provided range.
   */
  occupies(day: Day, range: TimeRange): boolean {
    return this.days.includes(day) && this.timeRange.overlaps(range)
  }

  /**
   * Returns a new Course with the given fields patched.
   * The id is preserved so downstream references remain stable.
   */
  with(patch: {
    name?:      string
    days?:      Day[]
    timeRange?: TimeRange
    color?:     CourseColor
  }): Course {
    return new Course(
      patch.name      ?? this.name,
      patch.days      ?? [...this.days],
      patch.timeRange ?? this.timeRange,
      patch.color     ?? this.color,
      this.id,
    )
  }
}
