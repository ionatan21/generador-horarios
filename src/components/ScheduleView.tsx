import { useMemo } from 'react'
import { DAYS, DAY_NAMES, TimeSlot } from '../domain'
import type { Schedule, Course } from '../domain'
import type { Day } from '../domain'
import './ScheduleView.css'

const SLOTS = TimeSlot.ALL

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1e293b' : '#ffffff'
}

interface Props {
  schedule: Schedule
}

export default function ScheduleView({ schedule }: Props) {
  const lookup = useMemo(() => {
    const map = new Map<Day, Map<string, Course>>()
    for (const day of DAYS) {
      const dayMap = new Map<string, Course>()
      for (const course of schedule.getCoursesForDay(day)) {
        dayMap.set(course.timeRange.start, course)
      }
      map.set(day, dayMap)
    }
    return map
  }, [schedule])

  return (
    <section className="schedule-view">
      <div className="sv-scroll">
        <div className="sv-grid">

          {/* Header row */}
          <div className="sv-cell sv-corner" />
          {DAYS.map((day) => (
            <div key={day} className="sv-cell sv-day-header">
              <span className="sv-day-abbr">{day}</span>
              <span className="sv-day-full">{DAY_NAMES[day]}</span>
            </div>
          ))}

          {/* Time-slot rows */}
          {SLOTS.map((slot) => (
            <>
              <div key={slot.start} className="sv-cell sv-time-label">
                {slot.start}
              </div>

              {DAYS.map((day) => {
                const course = lookup.get(day)?.get(slot.start)
                return (
                  <div key={day} className="sv-cell sv-slot">
                    {course && (
                      <div
                        className="sv-course-block"
                        style={{
                          backgroundColor: course.color.hex,
                          color: contrastColor(course.color.hex),
                          borderColor:
                            contrastColor(course.color.hex) === '#ffffff'
                              ? 'rgba(255,255,255,0.25)'
                              : 'rgba(0,0,0,0.12)',
                        }}
                      >
                        <span className="sv-course-name">{course.name}</span>
                        <div className="sv-tooltip">
                          <strong>{course.name}</strong>
                          <span>{course.timeRange.start} &ndash; {course.timeRange.end}</span>
                          <span className="sv-tooltip-days">{course.days.join(' ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </section>
  )
}
