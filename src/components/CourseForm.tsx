import { useState, useMemo } from 'react'
import type { Course, Day } from '../types'
import './CourseForm.css'

const DAYS: Day[] = ['L', 'K', 'M', 'J', 'V', 'S', 'D']

const START_HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7
  return `${String(h).padStart(2, '0')}:00`
})

const END_HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7
  return `${String(h).padStart(2, '0')}:50`
})

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

const EMPTY_FORM = {
  name: '',
  days: [] as Day[],
  startTime: '',
  endTime: '',
  color: PRESET_COLORS[0],
}

interface Props {
  courses: Course[]
  onAdd: (course: Course) => void
}

export default function CourseForm({ courses, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState(false)

  /* ── validations ─────────────────────────────────────── */
  const timeError = useMemo(() => {
    if (!form.startTime || !form.endTime) return null
    return form.endTime <= form.startTime
      ? 'La hora de finalización debe ser mayor que la de inicio.'
      : null
  }, [form.startTime, form.endTime])

  const availableEndHours = useMemo(() => {
    if (!form.startTime) return END_HOURS
    const startHour = parseInt(form.startTime.split(':')[0], 10)
    return END_HOURS.filter((t) => parseInt(t.split(':')[0], 10) >= startHour)
  }, [form.startTime])

  const conflictWarning = useMemo(() => {
    if (!form.startTime || !form.endTime || timeError || form.days.length === 0) return null
    const conflict = courses.find((c) =>
      c.days.some((d) => form.days.includes(d)) &&
      form.startTime < c.endTime &&
      form.endTime > c.startTime
    )
    return conflict ? `Conflicto con "${conflict.name}"` : null
  }, [courses, form.startTime, form.endTime, form.days, timeError])

  const isValid =
    form.name.trim() !== '' &&
    form.days.length > 0 &&
    form.startTime !== '' &&
    form.endTime !== '' &&
    !timeError

  /* ── handlers ────────────────────────────────────────── */
  function toggleDay(day: Day) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      days: form.days,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
    })
    setForm(EMPTY_FORM)
    setTouched(false)
  }

  /* ── render ──────────────────────────────────────────── */
  return (
    <form className="course-form" onSubmit={handleSubmit} noValidate>
      <h2 className="cf-title">Crear curso</h2>

      {/* Course name */}
      <div className="cf-field">
        <label htmlFor="course-name" className="cf-label">
          Nombre del curso
        </label>
        <input
          id="course-name"
          type="text"
          className={`cf-input ${touched && !form.name.trim() ? 'cf-input--error' : ''}`}
          placeholder="Ej. Cálculo I"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        {touched && !form.name.trim() && (
          <span className="cf-error-msg">Este campo es obligatorio.</span>
        )}
      </div>

      {/* Days */}
      <div className="cf-field">
        <span className="cf-label">Días</span>
        <div className="cf-days">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`cf-day-btn ${form.days.includes(day) ? 'cf-day-btn--active' : ''}`}
              style={form.days.includes(day) ? { backgroundColor: form.color, borderColor: form.color } : undefined}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
        {touched && form.days.length === 0 && (
          <span className="cf-error-msg">Selecciona al menos un día.</span>
        )}
      </div>

      {/* Time range */}
      <div className="cf-time-row">
        <div className="cf-field">
          <label htmlFor="start-time" className="cf-label">Desde</label>
          <select
            id="start-time"
            className={`cf-input cf-select ${touched && !form.startTime ? 'cf-input--error' : ''}`}
            value={form.startTime}
            onChange={(e) => {
              const newStart = e.target.value
              setForm((f) => ({
                ...f,
                startTime: newStart,
                endTime:
                  f.endTime && f.endTime.split(':')[0] < newStart.split(':')[0]
                    ? ''
                    : f.endTime,
              }))
            }}
          >
            <option value="">--</option>
            {START_HOURS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="cf-field">
          <label htmlFor="end-time" className="cf-label">Hasta</label>
          <select
            id="end-time"
            className={`cf-input cf-select ${timeError ? 'cf-input--error' : ''}`}
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          >
            <option value="">--</option>
            {availableEndHours.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      {timeError && <span className="cf-error-msg">{timeError}</span>}

      {/* Color picker */}
      <div className="cf-field">
        <span className="cf-label">Color</span>
        <div className="cf-colors">
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`cf-color-swatch ${form.color === hex ? 'cf-color-swatch--active' : ''}`}
              style={{ backgroundColor: hex }}
              aria-label={hex}
              onClick={() => setForm((f) => ({ ...f, color: hex }))}
            />
          ))}
          <label className="cf-color-custom" title="Color personalizado">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
            <span className="cf-color-custom__icon">+</span>
          </label>
        </div>
      </div>

      {/* Conflict warning */}
      {conflictWarning && (
        <div className="cf-warning">
          ⚠ {conflictWarning}
        </div>
      )}

      {/* Actions */}
      <div className="cf-actions">
        <button type="submit" className="cf-btn cf-btn--primary">
          Agregar curso
        </button>
      </div>
    </form>
  )
}
