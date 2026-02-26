# ClassGrid

ClassGrid is a browser-based weekly schedule builder aimed at students and educators. It lets you define courses with custom names, days, time ranges, and colors, then displays them in a clear grid. The schedule is persisted in the browser so it survives page reloads, and it can be exported in three formats for sharing or printing.

## Features

- Add courses with a name, one or more days of the week, a start/end time, and a color
- Automatic conflict detection: adding a course that overlaps an existing one is blocked with a warning
- Remove individual course-day assignments directly from the schedule grid
- Export the schedule as a PNG image, a PDF document, or an Excel spreadsheet
- Light and dark display modes
- Bilingual interface: Spanish and English, with the preference saved in the browser
- All data is stored in `localStorage`; no server or account is required

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 with TypeScript |
| Build tool | Vite |
| Internationalisation | i18next + react-i18next |
| Image export | html2canvas |
| PDF export | jsPDF |
| Excel export | SheetJS (xlsx) |

## Project structure

```
src/
  components/       # CourseForm and ScheduleView UI components
  domain/           # Core business logic (Course, Schedule, TimeRange, etc.)
  hooks/            # usePersistedCourses — localStorage integration
  i18n/             # i18next setup and locale files (en, es)
  assets/           # Icons and the app logo
```

The domain layer is intentionally free of framework dependencies. `Course` and `Schedule` are plain TypeScript classes that enforce invariants (non-empty name, at least one day, no overlapping time slots) independently of the UI.

## Getting started

**Requirements:** Node.js 18 or later and pnpm.

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Build for production
pnpm build

# Preview the production build
pnpm preview
```

## Internationalisation

Locale files live in `src/i18n/locales/`. Each file is a flat JSON object. To add a new language, create a new locale file, register it in `src/i18n/index.ts`, and add the language option to the toggle in `ScheduleView`.

## Author

Built by [Jonatan Barrios](https://portfolio-jonatan-barrios.vercel.app/).

