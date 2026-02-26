import type { Day } from './types'
import type { TimeRange } from './TimeRange'
import { Course } from './Course'

/**
 * DaySchedule — manages all courses assigned to a single day of the week.
 * Handles conflict detection at the day level.
 */
export class DaySchedule {
  readonly day: Day
  private readonly _courses: Course[] = []

  constructor(day: Day) {
    this.day = day
  }

  /**
   * Returns the first course that conflicts with the given range, or null.
   * A conflict means the existing course's TimeRange overlaps the candidate.
   */
  getConflict(range: TimeRange): Course | null {
    return this._courses.find((c) => c.timeRange.overlaps(range)) ?? null
  }

  hasConflict(range: TimeRange): boolean {
    return this.getConflict(range) !== null
  }

  /**
   * Adds a course to this day.
   * Throws a descriptive error if a time conflict is detected.
   */
  add(course: Course): void {
    const conflict = this.getConflict(course.timeRange)
    if (conflict) {
      throw new Error(
        `Conflict on ${this.day}: "${course.name}" (${course.timeRange}) ` +
        `overlaps with "${conflict.name}" (${conflict.timeRange})`,
      )
    }
    this._courses.push(course)
  }

  /** Removes a course by id. Silent no-op if not found. */
  remove(courseId: string): void {
    const idx = this._courses.findIndex((c) => c.id === courseId)
    if (idx !== -1) this._courses.splice(idx, 1)
  }

  /** Returns courses sorted ascending by start time. */
  getCourses(): readonly Course[] {
    return [...this._courses].sort((a, b) =>
      a.timeRange.start.localeCompare(b.timeRange.start),
    )
  }
}
