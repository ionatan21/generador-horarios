import { type Day, DAYS } from './types'
import { DaySchedule } from './DaySchedule'
import { Course } from './Course'

// ── Result types ─────────────────────────────────────────────────────────────

export interface ConflictFound {
  hasConflict: true
  /** The existing course that would be overlapped. */
  existing: Course
  /** The first day where the conflict was found. */
  day: Day
}

export interface NoConflict {
  hasConflict: false
}

export type ConflictCheck = ConflictFound | NoConflict

// ── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Schedule — the top-level aggregate.
 * Owns one DaySchedule per day and guarantees no time conflicts across the week.
 */
export class Schedule {
  private readonly _days: Map<Day, DaySchedule>

  constructor() {
    this._days = new Map(DAYS.map((d) => [d, new DaySchedule(d)]))
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  getDay(day: Day): DaySchedule {
    return this._days.get(day)!
  }

  /** Returns all unique courses across the week, sorted by first-day then start time. */
  getCourses(): Course[] {
    const seen = new Set<string>()
    const result: Course[] = []
    for (const day of DAYS) {
      for (const course of this.getDay(day).getCourses()) {
        if (!seen.has(course.id)) {
          seen.add(course.id)
          result.push(course)
        }
      }
    }
    return result
  }

  /** Returns courses assigned to a specific day, sorted by start time. */
  getCoursesForDay(day: Day): readonly Course[] {
    return this.getDay(day).getCourses()
  }

  /**
   * Inspects whether adding the given course would create a conflict.
   * Does NOT mutate the schedule.
   */
  checkConflict(course: Course): ConflictCheck {
    for (const day of course.days) {
      const existing = this.getDay(day).getConflict(course.timeRange)
      if (existing) return { hasConflict: true, existing, day }
    }
    return { hasConflict: false }
  }

  // ── Commands ─────────────────────────────────────────────────────────────────

  /**
   * Adds a course to all its days.
   * Throws a descriptive error if a conflict is detected.
   */
  addCourse(course: Course): void {
    const check = this.checkConflict(course)
    if (check.hasConflict) {
      throw new Error(
        `Cannot add "${course.name}": conflicts with "${check.existing.name}" on day ${check.day}`,
      )
    }
    for (const day of course.days) {
      this.getDay(day).add(course)
    }
  }

  /**
   * Safe version of addCourse — returns the conflict info instead of throwing.
   */
  tryAddCourse(course: Course): ConflictCheck {
    const check = this.checkConflict(course)
    if (check.hasConflict) return check
    this.addCourse(course)
    return { hasConflict: false }
  }

  /** Removes a course from all days by id. */
  removeCourse(courseId: string): void {
    for (const day of DAYS) {
      this.getDay(day).remove(courseId)
    }
  }

  /** Returns a new Schedule with all courses from the current one re-added. */
  clone(): Schedule {
    const copy = new Schedule()
    for (const course of this.getCourses()) {
      copy.addCourse(course)
    }
    return copy
  }
}
