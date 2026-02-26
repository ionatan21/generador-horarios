import { useState, useEffect } from 'react'
import { Course, CourseColor, TimeRange } from '../domain'
import type { Day } from '../domain'

const STORAGE_KEY = 'classgrid:courses'

interface SerializedCourse {
  id: string
  name: string
  days: Day[]
  start: string
  end: string
  color: string
}

function serialize(courses: Course[]): string {
  const data: SerializedCourse[] = courses.map((c) => ({
    id: c.id,
    name: c.name,
    days: [...c.days],
    start: c.timeRange.start,
    end: c.timeRange.end,
    color: c.color.hex,
  }))
  return JSON.stringify(data)
}

function deserialize(raw: string): Course[] {
  try {
    const data: SerializedCourse[] = JSON.parse(raw)
    return data.map(
      (d) =>
        new Course(
          d.name,
          d.days,
          new TimeRange(d.start, d.end),
          new CourseColor(d.color),
          d.id,
        ),
    )
  } catch {
    return []
  }
}

function loadFromStorage(): Course[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? deserialize(raw) : []
}

export function usePersistedCourses() {
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serialize(courses))
  }, [courses])

  function clearCourses() {
    setCourses([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { courses, setCourses, clearCourses }
}
