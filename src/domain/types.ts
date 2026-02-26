/** Single-letter abbreviations used as column keys in the schedule grid. */
export type Day = 'L' | 'K' | 'M' | 'J' | 'V' | 'S' | 'D'

export const DAYS: readonly Day[] = ['L', 'K', 'M', 'J', 'V', 'S', 'D']

export const DAY_NAMES: Record<Day, string> = {
  L: 'Lunes',
  K: 'Martes',
  M: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
  D: 'Domingo',
}
