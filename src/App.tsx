import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import logo from './assets/logo.svg'
import iconMoon from './assets/icon-moon.svg'
import iconSun from './assets/icon-sun.svg'
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
  // Volatile: holds the schedule fetched from a shared link, never persisted
  const [sharedCourses, setSharedCourses] = useState<Course[]>([])
  // Persisted share ID — reused so we never duplicate a document in the DB
  const [currentShareId, setCurrentShareId] = useState<string | null>(
    () => localStorage.getItem('shareId'),
  )

  function saveShareId(id: string) {
    setCurrentShareId(id)
    localStorage.setItem('shareId', id)
  }

  function clearShareId() {
    setCurrentShareId(null)
    localStorage.removeItem('shareId')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('s')
    if (!shareId) return

    setIsSharedView(true)
    fetch(`/api/getSchedule?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data: { schedule?: SerializedCourse[] }) => {
        if (Array.isArray(data.schedule)) {
          // Load into volatile state — user's own localStorage is untouched
          setSharedCourses(deserializeCourses(data.schedule))
          saveShareId(shareId)
        }
      })
      .catch(() => {
        // silently ignore; user keeps their existing courses
      })
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  // ── Share ──────────────────────────────────────────────────────────────────

  const [shareState, setShareState] = useState<ShareState>({ status: 'idle' })

  async function handleShare() {
    if (courses.length === 0) return

    const copyAndShow = async (url: string) => {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShareState({ status: 'done', url })
      setTimeout(() => setShareState({ status: 'idle' }), 2500)
    }

    // Reuse existing share ID if the schedule hasn't been modified
    if (currentShareId) {
      await copyAndShow(`${window.location.origin}?s=${currentShareId}`)
      return
    }
    setShareState({ status: 'loading' })
    try {
      const res = await fetch('/api/createSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: serializeCourses(courses) }),
      })
      const data: { id?: string; error?: string } = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Unknown error')
      saveShareId(data.id)
      await copyAndShow(`${window.location.origin}?s=${data.id}`)
    } catch {
      setShareState({ status: 'error' })
    }
  }

  function handleShareClose() {
    setShareState({ status: 'idle' })
  }

  function handleDismissSharedView() {
    // Persist the shared schedule to localStorage now that the user claims it
    setCourses(sharedCourses)
    setSharedCourses([])
    setIsSharedView(false)
    // Remove query param from URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.delete('s')
    window.history.replaceState({}, '', url.pathname)
  }

  // ── Schedule ───────────────────────────────────────────────────────────────

  // In shared view show the fetched schedule; otherwise show the user's own
  const displayedCourses = isSharedView ? sharedCourses : courses

  const schedule = useMemo(() => {
    const s = new Schedule()
    for (const c of displayedCourses) s.tryAddCourse(c)
    return s
  }, [displayedCourses])

  function handleAddCourse(course: Course) {
    clearShareId()
    setCourses((prev) => [...prev, course])
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
      setTimeout(() => {
        mainRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  function handleClear() {
    clearShareId()
    clearCourses()
  }

  function handleRemoveCourseFromDay(courseId: string, day: Day) {
    clearShareId()
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
            className="app-brand__dark"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle dark mode"
          >
            <img src={darkMode ? iconSun : iconMoon} alt="" width="16" height="16" />
          </button>
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
