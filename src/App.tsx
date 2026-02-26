import { useState, useMemo } from 'react'
import CourseForm from './components/CourseForm'
import ScheduleView from './components/ScheduleView'
import { Schedule, Course } from './domain'
import type { Day } from './domain'
import './App.css'

function App() {
  const [courses, setCourses]     = useState<Course[]>([])
  const [darkMode, setDarkMode]   = useState(false)

  const schedule = useMemo(() => {
    const s = new Schedule()
    for (const c of courses) s.tryAddCourse(c)
    return s
  }, [courses])

  function handleAddCourse(course: Course) {
    setCourses((prev) => [...prev, course])
  }

  function handleClear() {
    setCourses([])
  }

  function handleRemoveCourseFromDay(courseId: string, day: Day) {
    setCourses((prev) =>
      prev.flatMap((c) => {
        if (c.id !== courseId) return [c]
        const newDays = c.days.filter((d) => d !== day)
        if (newDays.length === 0) return []
        return [c.with({ days: newDays })]
      }),
    )
  }

  return (
    <div className={`app-layout${darkMode ? ' dark' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__icon">▦</span>
          <span className="app-brand__name">ClassGrid</span>
        </div>
        <CourseForm schedule={schedule} onAdd={handleAddCourse} />
      </aside>

      <main className="app-main">
        <ScheduleView
          schedule={schedule}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onClear={handleClear}
          onRemoveCourseFromDay={handleRemoveCourseFromDay}
        />
      </main>
    </div>
  )
}

export default App
