import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  fetchAvailability,
  formatAppointment,
  formatTimeLabel,
  generateSlots,
  getUpcomingDays,
  isSlotInPast,
  to12Hour,
} from '../lib/scheduling.js'

/* A real clock face: numerals 1–12 at their true positions, 12 at the top,
   3 at the right. Half-hour slots were dropped because they doubled the number
   of targets and made the dial fiddly to use — the hour numerals now sit where
   people already expect them, so there is nothing to learn. */
const CENTER = 50
const NUMERAL_RADIUS = 34
const TICK_OUTER = 46
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

/** Degrees clockwise from 12 o'clock for a given hour numeral. */
const hourAngle = (hour12) => (hour12 % 12) * 30

function polar(hour12, radius) {
  const rad = ((hourAngle(hour12) - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

export default function AppointmentPicker({ value, onChange, errorMessage, refreshToken = 0 }) {
  const days = useMemo(() => getUpcomingDays(), [])
  const allSlots = useMemo(() => generateSlots(), [])

  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [hintedHour, setHintedHour] = useState(null)
  const [period, setPeriod] = useState('AM')

  const selectedDate = value?.date ?? null
  const selectedTime = value?.time ?? null

  const dialRef = useRef(null)
  const handRef = useRef(null)
  const handAngle = useRef({ deg: 0 })
  const autoPeriodFor = useRef(null)

  useEffect(() => {
    if (!selectedDate && days.length) onChange({ date: days[0].key, time: null })
  }, [days, selectedDate, onChange])

  /* ----------------------------- availability ---------------------------- */
  useEffect(() => {
    if (!selectedDate) return
    const controller = new AbortController()
    let active = true

    setLoading(true)
    setLoadError(null)

    fetchAvailability(selectedDate, { signal: controller.signal })
      .then(({ bookedSlots: booked }) => {
        if (active) setBookedSlots(booked)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setBookedSlots([])
        setLoadError('Could not check live availability — showing all times.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [selectedDate, refreshToken])

  /* ------------------------------ slot state ----------------------------- */
  const slotStates = useMemo(
    () =>
      allSlots.map((time) => {
        const taken = bookedSlots.includes(time)
        const past = selectedDate ? isSlotInPast(selectedDate, time) : false
        return { time, taken, past, available: !taken && !past, ...to12Hour(time) }
      }),
    [allSlots, bookedSlots, selectedDate],
  )

  /** Clock position -> the slot sitting on it, for the period on show. */
  const hourStates = useMemo(() => {
    const map = new Map(slotStates.filter((s) => s.period === period).map((s) => [s.hour12, s]))
    return HOURS.map((hour12) => {
      const slot = map.get(hour12)
      return {
        hour12,
        time: slot?.time ?? null,
        // A numeral with no slot behind it is outside business hours entirely
        // (or is the lunch hour) — distinct from one that's merely booked,
        // or one that's simply already gone by earlier today.
        available: Boolean(slot?.available),
        taken: Boolean(slot?.taken),
        past: Boolean(slot?.past),
        offHours: !slot,
      }
    })
  }, [slotStates, period])

  const availableCount = slotStates.filter((s) => s.available).length
  const fullyBooked = !loading && availableCount === 0
  const periodHasSlots = useMemo(
    () => ({
      AM: slotStates.some((s) => s.period === 'AM' && s.available),
      PM: slotStates.some((s) => s.period === 'PM' && s.available),
    }),
    [slotStates],
  )

  const nextDay = useMemo(() => {
    const i = days.findIndex((d) => d.key === selectedDate)
    return i >= 0 && i < days.length - 1 ? days[i + 1] : null
  }, [days, selectedDate])

  // Open on whichever half of the day actually has openings, so the clock is
  // never showing an all-dimmed face on arrival. Once per date, so it can't
  // fight a manual toggle.
  useEffect(() => {
    if (!selectedDate || loading) return
    if (autoPeriodFor.current === selectedDate) return
    const first = slotStates.find((s) => s.available)
    if (first) {
      setPeriod(first.period)
      autoPeriodFor.current = selectedDate
    }
  }, [selectedDate, loading, slotStates])

  /* --------------------------- hand animation ---------------------------- */
  const animateHandTo = useCallback((hour12, { immediate = false } = {}) => {
    if (!handRef.current) return
    const targetDeg = hourAngle(hour12)
    const from = handAngle.current.deg
    let delta = ((targetDeg - from + 180) % 360) - 180
    if (delta < -180) delta += 360
    const to = from + delta

    gsap.killTweensOf(handAngle.current)
    const apply = () =>
      handRef.current?.setAttribute('transform', `rotate(${handAngle.current.deg} ${CENTER} ${CENTER})`)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (immediate || reduceMotion) {
      handAngle.current.deg = to
      apply()
      return
    }
    gsap.to(handAngle.current, {
      deg: to,
      duration: 0.5,
      ease: 'back.out(1.7)',
      onUpdate: apply,
      onComplete: () => {
        handAngle.current.deg = to
        apply()
      },
    })
  }, [])

  useEffect(() => {
    if (!selectedTime) return
    animateHandTo(to12Hour(selectedTime).hour12)
  }, [selectedTime, animateHandTo])

  useEffect(() => {
    if (!dialRef.current || !selectedDate) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      dialRef.current,
      { autoAlpha: 0, scale: 0.92 },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
    )
  }, [selectedDate])

  /* ------------------------------ selection ------------------------------ */
  const selectHour = useCallback(
    (hourState) => {
      if (!hourState.available) {
        setHintedHour(hourState.hour12)
        return
      }
      setHintedHour(null)
      onChange({ date: selectedDate, time: hourState.time })
    },
    [onChange, selectedDate],
  )

  const changePeriod = (next) => {
    setPeriod(next)
    setHintedHour(null)
    // The hand would otherwise keep pointing at an hour that now means a
    // different time of day, so drop the selection rather than silently
    // reinterpreting it.
    if (selectedTime && to12Hour(selectedTime).period !== next) {
      onChange({ date: selectedDate, time: null })
    }
  }

  const selectDate = (dateKey) => {
    setHintedHour(null)
    onChange({ date: dateKey, time: null })
  }

  /* -------------------------- drag on the handle -------------------------- */
  const nearestAvailableHour = useCallback(
    (deg) => {
      const raw = ((deg % 360) + 360) % 360
      let best = null
      let bestDist = Infinity
      hourStates.forEach((h) => {
        if (!h.available) return
        const d = Math.abs(((hourAngle(h.hour12) - raw + 180) % 360) - 180)
        if (d < bestDist) {
          bestDist = d
          best = h
        }
      })
      return best
    },
    [hourStates],
  )

  const handlePointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    const rect = dialRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const angleAt = (ev) => (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90

    const move = (ev) => {
      const h = nearestAvailableHour(angleAt(ev))
      if (!h) return
      handAngle.current.deg = hourAngle(h.hour12)
      handRef.current?.setAttribute('transform', `rotate(${handAngle.current.deg} ${CENTER} ${CENTER})`)
    }

    const up = (ev) => {
      const h = nearestAvailableHour(angleAt(ev))
      if (h) selectHour(h)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const selectedHour12 = selectedTime ? to12Hour(selectedTime).hour12 : null
  const handlePos = polar(selectedHour12 ?? 12, NUMERAL_RADIUS)

  return (
    <div className="min-w-0">
      <p className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
        Appointment Date &amp; Time
      </p>
      <p className="mb-4 text-xs leading-relaxed text-ink-faint">
        Pick a day, choose AM or PM, then tap the hour on the clock.
      </p>

      {/* ------------------------------ date strip ------------------------------ */}
      <div
        className="snap-carousel -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2"
        role="group"
        aria-label="Choose an appointment date"
      >
        {days.map((d) => {
          const active = d.key === selectedDate
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => selectDate(d.key)}
              aria-pressed={active}
              aria-label={d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              className={`flex min-w-[62px] shrink-0 snap-start flex-col items-center rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                active
                  ? 'border-accent-strong bg-accent-strong/15 text-accent shadow-[0_0_18px_rgba(212,169,78,0.25)]'
                  : 'border-line bg-card text-ink hover:border-accent-strong/50 hover:text-accent'
              }`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">{d.weekday}</span>
              <span className="mt-0.5 font-display text-xl font-semibold leading-none">{d.dayNumber}</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">{d.month}</span>
            </button>
          )
        })}
      </div>

      {/* --------------------------- clock + AM/PM --------------------------- */}
      <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-7">
        <div ref={dialRef} className="relative aspect-square w-full max-w-[290px]" aria-busy={loading}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {/* Case */}
            <circle cx={CENTER} cy={CENTER} r={TICK_OUTER + 1.5} fill="none" stroke="var(--accent-strong)" strokeWidth="0.5" opacity="0.55" />
            <circle cx={CENTER} cy={CENTER} r={TICK_OUTER - 5.5} fill="none" stroke="var(--accent-strong)" strokeWidth="0.2" opacity="0.2" />

            {/* Minute ticks, with the hour marks longer — the detail that makes
                it read as a clock rather than a generic ring of dots. */}
            {Array.from({ length: 60 }, (_, i) => {
              const isHour = i % 5 === 0
              const rad = ((i * 6 - 90) * Math.PI) / 180
              const inner = isHour ? TICK_OUTER - 4 : TICK_OUTER - 1.8
              return (
                <line
                  key={i}
                  x1={CENTER + inner * Math.cos(rad)}
                  y1={CENTER + inner * Math.sin(rad)}
                  x2={CENTER + TICK_OUTER * Math.cos(rad)}
                  y2={CENTER + TICK_OUTER * Math.sin(rad)}
                  stroke="var(--accent-strong)"
                  strokeWidth={isHour ? 0.7 : 0.25}
                  opacity={isHour ? 0.65 : 0.25}
                  strokeLinecap="round"
                />
              )
            })}

            {/* Hour hand */}
            <g
              ref={handRef}
              transform={`rotate(0 ${CENTER} ${CENTER})`}
              style={{ opacity: selectedTime ? 1 : 0, transition: 'opacity 300ms' }}
            >
              <line
                x1={CENTER}
                y1={CENTER + 4}
                x2={CENTER}
                y2={CENTER - NUMERAL_RADIUS + 7}
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
            <circle cx={CENTER} cy={CENTER} r="1.6" fill="var(--accent)" opacity={selectedTime ? 1 : 0.35} />
          </svg>

          {/* Hour numerals */}
          {hourStates.map((h) => {
            const pos = polar(h.hour12, NUMERAL_RADIUS)
            const isSelected = selectedHour12 === h.hour12 && Boolean(selectedTime)
            return (
              <button
                key={h.hour12}
                type="button"
                onClick={() => selectHour(h)}
                onMouseEnter={() => !h.available && setHintedHour(h.hour12)}
                onMouseLeave={() => setHintedHour(null)}
                onFocus={() => !h.available && setHintedHour(h.hour12)}
                onBlur={() => setHintedHour(null)}
                disabled={loading}
                aria-label={`${h.hour12} ${period}${
                  h.taken
                    ? ' — already booked'
                    : h.past
                      ? ' — already passed today'
                      : h.offHours
                        ? ' — not available'
                        : ''
                }`}
                aria-pressed={isSelected}
                aria-disabled={!h.available}
                className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <span
                  className={`font-display text-lg font-semibold leading-none transition-all duration-300 ${
                    isSelected
                      ? 'scale-125 text-accent [text-shadow:0_0_12px_rgba(232,196,118,0.85)]'
                      : h.available
                        ? 'text-ink hover:scale-110 hover:text-accent'
                        : 'text-ink-faint/40'
                  }`}
                >
                  {h.hour12}
                </span>
              </button>
            )
          })}

          {/* Draggable handle on the selected numeral */}
          {selectedTime && !loading && (
            <button
              type="button"
              onPointerDown={handlePointerDown}
              aria-label={`Drag to change the hour. Currently ${formatTimeLabel(selectedTime)}`}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing"
              style={{ left: `${handlePos.x}%`, top: `${handlePos.y}%` }}
            >
              <span className="pointer-events-none absolute inset-1 rounded-full border-2 border-accent/70 bg-accent/10" />
            </button>
          )}

          {/* Status in the middle of the face */}
          {/* Sits between the hub and the 6 — any lower and it crowds the numeral. */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[31%]">
            {loading ? (
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-mute">Checking…</span>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {fullyBooked ? 'No times left' : selectedTime ? formatTimeLabel(selectedTime) : `Tap an hour`}
              </span>
            )}
          </div>
        </div>

        {/* AM / PM — stacked beside the clock on wider screens */}
        <div
          className="flex gap-2 sm:flex-col"
          role="group"
          aria-label="Choose morning or afternoon"
        >
          {['AM', 'PM'].map((p) => {
            const active = period === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => changePeriod(p)}
                aria-pressed={active}
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                  active
                    ? 'border-accent-strong bg-accent-strong/15 text-accent shadow-[0_0_18px_rgba(212,169,78,0.25)]'
                    : 'border-line bg-card text-ink hover:border-accent-strong/50 hover:text-accent'
                }`}
              >
                {p}
                {/* Quietly flag a half-day with nothing left, so people don't
                    tap across and find an empty face. */}
                {!periodHasSlots[p] && !loading && (
                  <span className="mt-0.5 block text-[9px] font-normal uppercase tracking-wider text-ink-faint">
                    Full
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-3 h-5 text-center text-xs text-ink-mute" aria-live="polite">
        {hintedHour != null && (
          <span className="rounded-full border border-line px-2.5 py-1 text-ink-faint">
            {hintedHour} {period} —{' '}
            {(() => {
              const h = hourStates.find((x) => x.hour12 === hintedHour)
              return h?.taken ? 'Taken' : h?.past ? 'Already passed' : 'Not available'
            })()}
          </span>
        )}
      </p>

      <p className="mt-1 text-center text-sm font-medium text-ink-hi" aria-live="polite">
        {selectedTime ? (
          formatAppointment(selectedDate, selectedTime)
        ) : (
          <span className="text-ink-mute">No time selected yet</span>
        )}
      </p>

      {fullyBooked && (
        <div className="mt-3 text-center">
          <p className="text-sm text-ink-mute">Fully booked — try another date.</p>
          {nextDay && (
            <button
              type="button"
              onClick={() => selectDate(nextDay.key)}
              className="mt-2 rounded-full border border-accent-strong/50 px-4 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent-fill hover:text-accent-fill-ink"
            >
              Try {nextDay.weekday}, {nextDay.month} {nextDay.dayNumber}
            </button>
          )}
        </div>
      )}

      {loadError && <p className="mt-2 text-center text-xs text-ink-faint">{loadError}</p>}

      {errorMessage && (
        <p
          className="mt-3 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-center text-sm text-red-200"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      {/* ----------------- accessible dropdown, kept in sync ------------------ */}
      <div className="mt-5">
        <label
          htmlFor="bk-appointment-time"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute"
        >
          Or choose from the list
        </label>
        <select
          id="bk-appointment-time"
          value={selectedTime ?? ''}
          onChange={(e) => {
            const slot = slotStates.find((s) => s.time === e.target.value)
            if (!slot?.available) return
            setPeriod(slot.period)
            onChange({ date: selectedDate, time: slot.time })
          }}
          disabled={loading}
          className="field-input field-select"
        >
          <option value="" disabled>
            {loading ? 'Checking availability…' : 'Select a time…'}
          </option>
          {slotStates.map((slot) => (
            <option key={slot.time} value={slot.time} disabled={!slot.available}>
              {formatTimeLabel(slot.time)}
              {slot.taken ? ' — Taken' : slot.past ? ' — Passed' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
