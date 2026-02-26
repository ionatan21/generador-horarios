/**
 * src/types.ts — public re-export of the domain layer.
 * Import domain types from here or directly from 'src/domain'.
 */
export type { Day } from './domain/types'
export { DAYS, DAY_NAMES } from './domain/types'
export { CourseColor } from './domain/CourseColor'
export { TimeRange } from './domain/TimeRange'
export { TimeSlot } from './domain/TimeSlot'
export { Course } from './domain/Course'
export { DaySchedule } from './domain/DaySchedule'
export { Schedule } from './domain/Schedule'
export type { ConflictCheck, ConflictFound, NoConflict } from './domain/Schedule'
