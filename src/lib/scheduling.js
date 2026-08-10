/* ===========================================================================
   APPOINTMENT SCHEDULING — single source of truth
   ---------------------------------------------------------------------------
   Everything about when Supriya is available lives in this one block. Nothing
   below this config, and nothing in any component, hardcodes an hour or a day.

   NOTE: these are the *appointment* settings — when the paid session happens.
   They have nothing to do with the client's own "Time of Birth" field in the
   booking form, which is birth data for the reading itself.
   ========================================================================= */

// CONFIRM WITH CLIENT BEFORE LAUNCH
export const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// CONFIRM WITH CLIENT BEFORE LAUNCH
export const WORKING_HOURS = { start: '10:00', end: '19:00' }

// CONFIRM WITH CLIENT BEFORE LAUNCH
export const LUNCH_BREAK = { start: '13:00', end: '14:00' }

/* Hourly, deliberately. The picker is a real clock face with 12 hour numerals,
   so a slot length that isn't a whole hour can't be represented on it — two
   slots would land on the same numeral and one would be unreachable. If this
   ever needs to be 30 again, the clock has to gain a minute hand first. */
export const SLOT_LENGTH_MINUTES = 60

/** How many bookable days to show in the date strip. */
export const DAYS_TO_SHOW = 14

/* ---------------------------------------------------------------------------
   Backend contract. The Apps Script web app is deployed separately; this
   frontend is built against the agreed contract:
     GET  {APPS_SCRIPT_URL}?action=availability&date=YYYY-MM-DD
          -> { bookedSlots: ["10:00", "10:30", ...] }
     POST {APPS_SCRIPT_URL}
          body { action:'reserve', date, time, name, whatsapp, consultationType }
          -> { success: true, holdId } | { success: false, message }
--------------------------------------------------------------------------- */
export const APPS_SCRIPT_URL = 'REPLACE_WITH_DEPLOYED_WEB_APP_URL'

/**
 * The site is already live, so until the Apps Script above is actually
 * deployed we must NOT fire requests at a placeholder string — that would
 * throw on every date tap for real visitors. When unconfigured we degrade to
 * "every slot is open" and the booking still completes over WhatsApp.
 */
export function isBackendConfigured() {
  return /^https?:\/\//i.test(APPS_SCRIPT_URL)
}

/* ------------------------------- time math ------------------------------- */

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function toTimeString(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "14:00" -> { hour12: 2, period: 'PM' } — what the clock face needs. */
export function to12Hour(hhmm) {
  const h24 = Math.floor(toMinutes(hhmm) / 60)
  return {
    hour12: h24 % 12 === 0 ? 12 : h24 % 12,
    period: h24 >= 12 ? 'PM' : 'AM',
  }
}

/** "14:30" -> "2:30 PM" */
export function formatTimeLabel(hhmm) {
  const mins = toMinutes(hhmm)
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
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

export function isWorkingDay(date) {
  return WORKING_DAYS.includes(DAY_ABBR[date.getDay()])
}

/** The next DAYS_TO_SHOW working days, starting today. */
export function getUpcomingDays(count = DAYS_TO_SHOW, from = new Date()) {
  const days = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  // Guard the loop: even an empty WORKING_DAYS config can't spin forever.
  for (let guard = 0; days.length < count && guard < 400; guard++) {
    if (isWorkingDay(cursor)) {
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
 * All slot start times for a working day: business hours, minus any slot that
 * overlaps the lunch break, in SLOT_LENGTH_MINUTES steps.
 */
export function generateSlots() {
  const open = toMinutes(WORKING_HOURS.start)
  const close = toMinutes(WORKING_HOURS.end)
  const lunchStart = toMinutes(LUNCH_BREAK.start)
  const lunchEnd = toMinutes(LUNCH_BREAK.end)

  const slots = []
  for (let t = open; t + SLOT_LENGTH_MINUTES <= close; t += SLOT_LENGTH_MINUTES) {
    const overlapsLunch = t < lunchEnd && t + SLOT_LENGTH_MINUTES > lunchStart
    if (!overlapsLunch) slots.push(toTimeString(t))
  }
  return slots
}

/** A slot earlier today can't be booked, so it is treated as unavailable. */
export function isSlotInPast(dateKey, hhmm, now = new Date()) {
  if (dateKey !== toDateKey(now)) return false
  return toMinutes(hhmm) <= now.getHours() * 60 + now.getMinutes()
}

/** "Tuesday, Aug 12 · 3:00 PM" */
export function formatAppointment(dateKey, hhmm) {
  if (!dateKey || !hhmm) return ''
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  return `${label} · ${formatTimeLabel(hhmm)}`
}

/* ------------------------------- API calls ------------------------------- */

export async function fetchAvailability(dateKey, { signal } = {}) {
  if (!isBackendConfigured()) return { bookedSlots: [], usingFallback: true }

  const url = `${APPS_SCRIPT_URL}?action=availability&date=${encodeURIComponent(dateKey)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Availability check failed (${res.status})`)
  const data = await res.json()
  return { bookedSlots: Array.isArray(data?.bookedSlots) ? data.bookedSlots : [], usingFallback: false }
}

export async function reserveSlot({ date, time, name, whatsapp, consultationType }) {
  if (!isBackendConfigured()) return { success: true, holdId: null, usingFallback: true }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    // Apps Script web apps reject preflighted requests, so this stays a
    // "simple" request: text/plain avoids the CORS preflight entirely.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'reserve', date, time, name, whatsapp, consultationType }),
  })
  if (!res.ok) throw new Error(`Reservation failed (${res.status})`)
  return res.json()
}
