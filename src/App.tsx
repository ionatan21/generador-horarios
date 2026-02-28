import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import logo from './assets/logo.svg'
import CourseForm from './components/CourseForm'
import ScheduleView from './components/ScheduleView'
import { Schedule, Course, CourseColor, TimeRange } from './domain'
import type { Day } from './domain'
import { usePersistedCourses } from './hooks/usePersistedCourses'
import './App.css'

// ── Serialization helpers (mirrors usePersistedCourses format) ────────────────

interface SerializedCourse {
  id: string
  name: string
  days: Day[]
  start: string
  end: string
  color: string
}

function serializeCourses(courses: Course[]): SerializedCourse[] {
  return courses.map((c) => ({
    id: c.id,
    name: c.name,
    days: [...c.days],
    start: c.timeRange.start,
    end: c.timeRange.end,
    color: c.color.hex,
  }))
}

function deserializeCourses(data: SerializedCourse[]): Course[] {
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
}

// ── Share state ───────────────────────────────────────────────────────────────

export type ShareStatus = 'idle' | 'loading' | 'done' | 'error'

export interface ShareState {
  status: ShareStatus
  url?: string
}

function App() {
  const { courses, setCourses, clearCourses } = usePersistedCourses()
  const { i18n } = useTranslation()

  function toggleLang() {
    const next = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem('darkMode') === 'true',
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  /** When the URL has ?s=<id>, load that shared schedule once on mount. */
  const [isSharedView, setIsSharedView] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('s')
    if (!shareId) return

    setIsSharedView(true)
    fetch(`/api/getSchedule?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data: { schedule?: SerializedCourse[] }) => {
        if (Array.isArray(data.schedule)) {
          setCourses(deserializeCourses(data.schedule))
        }
      })
      .catch(() => {
        // silently ignore; user keeps their existing courses
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  // ── Share ──────────────────────────────────────────────────────────────────

  const [shareState, setShareState] = useState<ShareState>({ status: 'idle' })

  async function handleShare() {
    if (courses.length === 0) return
    setShareState({ status: 'loading' })
    try {
      const res = await fetch('/api/createSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: serializeCourses(courses) }),
      })
      const data: { id?: string; error?: string } = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Unknown error')
      const url = `${window.location.origin}?s=${data.id}`
      setShareState({ status: 'done', url })
    } catch {
      setShareState({ status: 'error' })
    }
  }

  function handleShareClose() {
    setShareState({ status: 'idle' })
  }

  function handleDismissSharedView() {
    setIsSharedView(false)
    // Remove query param from URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.delete('s')
    window.history.replaceState({}, '', url.pathname)
  }

  // ── Schedule ───────────────────────────────────────────────────────────────

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
            className="app-brand__lang"
            onClick={toggleLang}
            aria-label="Toggle language"
          >
            {i18n.language === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            className="app-brand__toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle form"
          >
            {sidebarOpen ? '✕' : '＋'}
          </button>
        </div>
        <div className="app-sidebar__body">
          <CourseForm schedule={schedule} onAdd={handleAddCourse} isSharedView={isSharedView} />
        </div>
      </aside>

      <main className="app-main" ref={mainRef}>
        <ScheduleView
          schedule={schedule}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onClear={handleClear}
          onRemoveCourseFromDay={handleRemoveCourseFromDay}
          onShare={handleShare}
          shareState={shareState}
          onShareClose={handleShareClose}
          isSharedView={isSharedView}
          onDismissSharedView={handleDismissSharedView}
        />
      </main>
    </div>
  )
}

export default App
