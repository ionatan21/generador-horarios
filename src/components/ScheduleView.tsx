import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { DAYS, DAY_NAMES, TimeSlot } from '../domain'
import type { Schedule, Day, Course } from '../domain'
import iconImage from '../assets/icon-image.svg'
import iconPdf from '../assets/icon-pdf.svg'
import iconExcel from '../assets/icon-excel.svg'
import iconMoon from '../assets/icon-moon.svg'
import iconSun from '../assets/icon-sun.svg'
import iconTrash from '../assets/icon-trash.svg'
import './ScheduleView.css'

const SLOTS = TimeSlot.ALL
const FIRST_HOUR = 7
const HEADER_ROW = 1
const SLOT_ROW_OFFSET = 2
const TIME_COL = 1
const DAY_COL_OFFSET = 2

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1e293b' : '#ffffff'
}

interface PendingRemoval {
  course: Course
  day: Day
}

interface Props {
  schedule: Schedule
  darkMode: boolean
  onToggleDark: () => void
  onClear: () => void
  onRemoveCourseFromDay: (courseId: string, day: Day) => void
}

export default function ScheduleView({ schedule, darkMode, onToggleDark, onClear, onRemoveCourseFromDay }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)

  async function exportImage() {
    if (!gridRef.current) return
    const canvas = await html2canvas(gridRef.current, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = 'horario.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function exportPDF() {
    if (!gridRef.current) return
    const canvas = await html2canvas(gridRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const w = canvas.width / 2
    const h = canvas.height / 2
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [w, h] })
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save('horario.pdf')
  }

  function exportExcel() {
    const header = ['Hora', ...DAYS.map((d) => DAY_NAMES[d])]
    const rows = SLOTS.map((slot) => {
      const row: string[] = [slot.start]
      for (const day of DAYS) {
        const course = schedule.getCoursesForDay(day).find((c) => c.timeRange.start === slot.start)
        row.push(course ? course.name : '')
      }
      return row
    })
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Horario')
    XLSX.writeFile(wb, 'horario.xlsx')
  }

  return (
    <section className="schedule-view">
      <div className="sv-toolbar">
        <h2 className="sv-toolbar__title">Horario semanal</h2>
        <div className="sv-toolbar__actions">
          <button className="sv-btn" onClick={exportImage} title="Exportar como imagen">
            <img className="sv-btn__icon" src={iconImage} alt="" />
            <span className="sv-btn__label">Exportar Imagen</span>
          </button>
          <button className="sv-btn" onClick={exportPDF} title="Exportar como PDF">
            <img className="sv-btn__icon" src={iconPdf} alt="" />
            <span className="sv-btn__label">PDF</span>
          </button>
          <button className="sv-btn" onClick={exportExcel} title="Exportar como Excel">
            <img className="sv-btn__icon" src={iconExcel} alt="" />
            <span className="sv-btn__label">Excel</span>
          </button>
          <div className="sv-toolbar__sep" />
          <button className={`sv-btn${darkMode ? ' sv-btn--active' : ''}`} onClick={onToggleDark} title="Modo oscuro">
            <img className="sv-btn__icon" src={darkMode ? iconSun : iconMoon} alt="" />
            <span className="sv-btn__label">{darkMode ? 'Claro' : 'Oscuro'}</span>
          </button>
          <button className="sv-btn sv-btn--danger" onClick={onClear} title="Limpiar horario">
            <img className="sv-btn__icon" src={iconTrash} alt="" />
            <span className="sv-btn__label">Limpiar</span>
          </button>
        </div>
      </div>

      <div className="sv-scroll">
        <div className="sv-grid" ref={gridRef}>
          <div className="sv-corner" style={{ gridColumn: TIME_COL, gridRow: HEADER_ROW }} />
          {DAYS.map((day, di) => (
            <div key={day} className="sv-day-header" style={{ gridColumn: di + DAY_COL_OFFSET, gridRow: HEADER_ROW }}>
              <span className="sv-day-abbr">{day}</span>
              <span className="sv-day-full">{DAY_NAMES[day]}</span>
            </div>
          ))}
          {SLOTS.map((slot, si) => {
            const gridRow = si + SLOT_ROW_OFFSET
            return (
              <>
                <div key={`t-${si}`} className="sv-time-label" style={{ gridColumn: TIME_COL, gridRow }}>{slot.start}</div>
                {DAYS.map((_day, di) => (
                  <div key={`bg-${si}-${di}`} className="sv-bg-cell" style={{ gridColumn: di + DAY_COL_OFFSET, gridRow }} />
                ))}
              </>
            )
          })}
          {DAYS.map((day, di) =>
            schedule.getCoursesForDay(day).map((course) => {
              const startHour = parseInt(course.timeRange.start.split(':')[0], 10)
              const endHour   = parseInt(course.timeRange.end.split(':')[0], 10)
              const rowStart  = startHour - FIRST_HOUR + SLOT_ROW_OFFSET
              const rowSpan   = endHour - startHour + 1
              const fg        = contrastColor(course.color.hex)
              return (
                <div
                  key={`${course.id}-${day}`}
                  className="sv-course-block"
                  style={{
                    gridColumn: di + DAY_COL_OFFSET,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    backgroundColor: course.color.hex,
                    color: fg,
                    borderColor: fg === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPendingRemoval({ course, day })}
                >
                  <span className="sv-course-name">{course.name}</span>
                  <div className="sv-tooltip">
                    <strong>{course.name}</strong>
                    <span>{course.timeRange.start} &ndash; {course.timeRange.end}</span>
                    <span className="sv-tooltip-days">{course.days.join(' ')}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {pendingRemoval && (
        <div className="sv-modal-overlay" onClick={() => setPendingRemoval(null)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <p className="sv-modal__message">
              ¿Eliminar <strong>{pendingRemoval.course.name}</strong> del{' '}
              <strong>{DAY_NAMES[pendingRemoval.day]}</strong>?
            </p>
            <div className="sv-modal__actions">
              <button
                className="sv-modal__btn sv-modal__btn--cancel"
                onClick={() => setPendingRemoval(null)}
              >
                Cancelar
              </button>
              <button
                className="sv-modal__btn sv-modal__btn--confirm"
                onClick={() => {
                  onRemoveCourseFromDay(pendingRemoval.course.id, pendingRemoval.day)
                  setPendingRemoval(null)
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
