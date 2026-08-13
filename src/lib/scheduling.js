/* ===========================================================================
   TIME HELPERS
   ---------------------------------------------------------------------------
   Pure functions only. The working days, hours and slot length that used to
   live here as hardcoded config are now fetched from the backend
   (?action=schedule) and passed in — see lib/api.js. Nothing in this file
   decides when Supriya is available; it only does the arithmetic.

   NOTE: these are *appointment* times — when the paid session happens. Nothing
   here relates to the "Time of Birth" field on the booking form, which is
   birth data for the reading itself.
   ========================================================================= */

/** How many bookable days to offer in the date strip. */
export const DAYS_TO_SHOW = 14

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/* The backend sends full day names ("Monday"), but abbreviations are just as
   plausible a thing for it to send later. Matching on the first three letters,
   case-insensitively, accepts either — a mismatch here empties the date strip
   entirely and kills booking with no visible error, so it is worth being
   forgiving about. */
function normaliseDay(name) {
  return String(name ?? '').trim().slice(0, 3).toLowerCase()
}

export function matchesWorkingDay(workingDays, date) {
  const wanted = normaliseDay(DAY_ABBR[date.getDay()])
  return workingDays.some((d) => normaliseDay(d) === wanted)
}

export { DAY_FULL }

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function toTimeString(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "14:30" -> { hour12: 2, minutes: 30, period: 'PM' } — what the clock needs. */
export function to12Hour(hhmm) {
  const total = toMinutes(hhmm)
  const h24 = Math.floor(total / 60)
  return {
    hour12: h24 % 12 === 0 ? 12 : h24 % 12,
    minutes: total % 60,
    period: h24 >= 12 ? 'PM' : 'AM',
  }
}

/** Degrees clockwise from 12 o'clock, including minutes — 9:30 sits between 9 and 10. */
export function clockAngle(hhmm) {
  const { hour12, minutes } = to12Hour(hhmm)
  return ((hour12 % 12) + minutes / 60) * 30
}

/** "14:30" -> "2:30 PM" */
export function formatTimeLabel(hhmm) {
  const { hour12, minutes, period } = to12Hour(hhmm)
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Local YYYY-MM-DD. Deliberately not toISOString() — that converts to UTC and
 * would hand back the previous day for anyone east of Greenwich, which is
 * every single one of this client's users.
 */
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** The next DAYS_TO_SHOW days matching the backend's working days. */
export function getUpcomingDays(workingDays, count = DAYS_TO_SHOW, from = new Date()) {
  if (!workingDays?.length) return []
  const days = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  // Guard the loop: a malformed workingDays list can't spin forever.
  for (let guard = 0; days.length < count && guard < 400; guard++) {
    if (matchesWorkingDay(workingDays, cursor)) {
      days.push({
        key: toDateKey(cursor),
        date: new Date(cursor),
        weekday: DAY_ABBR[cursor.getDay()],
        dayNumber: cursor.getDate(),
        month: cursor.toLocaleDateString('en-US', { month: 'short' }),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/**
 * Slot start times for each working window, kept grouped by window so the
 * clock can draw them as separate arcs. The real schedule is two distinct
 * sittings (morning and late evening) — the gap between them is simply not
 * available, rather than a "break" within one long day.
 *
 * `end` is the last bookable START time, not the closing time. So a
 * 19:00–23:00 window offers a 23:00 session (running to 23:30), which is how
 * "7 to 11" reads to a person. Treating `end` as the closing time instead
 * silently drops that final slot — the evening arc stopped at 10:30 PM.
 */
export function generateWindowSlots(workingWindows, slotLengthMinutes) {
  if (!workingWindows?.length || !slotLengthMinutes) return []
  return workingWindows
    .map(({ start, end }) => {
      const open = toMinutes(start)
      const lastStart = toMinutes(end)
      const slots = []
      for (let t = open; t <= lastStart; t += slotLengthMinutes) {
        slots.push(toTimeString(t))
      }
      return slots
    })
    .filter((slots) => slots.length > 0)
}

/** Flattened, chronological — for the dropdown and availability matching. */
export function flattenSlots(windowSlots) {
  return windowSlots.flat().sort((a, b) => toMinutes(a) - toMinutes(b))
}

/** A slot earlier today can't be booked, so it counts as unavailable. */
export function isSlotInPast(dateKey, hhmm, now = new Date()) {
  if (dateKey !== toDateKey(now)) return false
  return toMinutes(hhmm) <= now.getHours() * 60 + now.getMinutes()
}

/** "Tuesday, Aug 12" */
export function formatDateLabel(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/** "Tuesday, Aug 12 · 3:00 PM" */
export function formatAppointment(dateKey, hhmm) {
  if (!dateKey || !hhmm) return ''
  return `${formatDateLabel(dateKey)} · ${formatTimeLabel(hhmm)}`
}
