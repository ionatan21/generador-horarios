import { useState, useMemo, useEffect, useRef } from 'react'
import logo from './assets/logo.svg'
import CourseForm from './components/CourseForm'
import ScheduleView from './components/ScheduleView'
import { Schedule, Course } from './domain'
import type { Day } from './domain'
import { usePersistedCourses } from './hooks/usePersistedCourses'
import './App.css'

function App() {
  const { courses, setCourses, clearCourses } = usePersistedCourses()
  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem('darkMode') === 'true',
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const schedule = useMemo(() => {
    const s = new Schedule()
    for (const c of courses) s.tryAddCourse(c)
    return s
  }, [courses])

  function handleAddCourse(course: Course) {
    setCourses((prev) => [...prev, course])
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
      setTimeout(() => {
        mainRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  function handleClear() {
    clearCourses()
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
      <aside className={`app-sidebar${sidebarOpen ? ' app-sidebar--open' : ''}`}>
        <div className="app-brand">
          <img src={logo} className="app-brand__icon" alt="ClassGrid logo" />
          <span className="app-brand__name">ClassGrid</span>
          <button
            className="app-brand__toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle form"
          >
            {sidebarOpen ? '✕' : '＋'}
          </button>
        </div>
        <div className="app-sidebar__body">
          <CourseForm schedule={schedule} onAdd={handleAddCourse} />
        </div>
      </aside>

      <main className="app-main" ref={mainRef}>
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
