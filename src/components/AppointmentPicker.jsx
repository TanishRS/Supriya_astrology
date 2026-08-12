import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { fetchAvailability } from '../lib/api.js'
import {
  clockAngle,
  flattenSlots,
  formatAppointment,
  formatTimeLabel,
  generateWindowSlots,
  getUpcomingDays,
  isSlotInPast,
  to12Hour,
} from '../lib/scheduling.js'

/* A real clock face. Slot markers sit at their true angular position, minutes
   included — 9:30 lands between the 9 and the 10, exactly where a clock hand
   would be. That falls out of the geometry rather than being special-cased,
   which is what lets a half-hour slot length work at all. */
const CENTER = 50
const MARKER_RADIUS = 40
const NUMERAL_RADIUS = 29
const TICK_OUTER = 47

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

function pointAt(deg, radius) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

/** SVG arc between two angles — used to band each working window. */
function arcPath(startDeg, endDeg, radius) {
  const a = pointAt(startDeg, radius)
  const b = pointAt(endDeg, radius)
  const sweep = ((endDeg - startDeg) % 360 + 360) % 360
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
}

export default function AppointmentPicker({ schedule, value, onChange, errorMessage, refreshToken = 0 }) {
  const days = useMemo(() => getUpcomingDays(schedule.workingDays), [schedule.workingDays])
  const windowSlots = useMemo(
    () => generateWindowSlots(schedule.workingWindows, schedule.slotLengthMinutes),
    [schedule.workingWindows, schedule.slotLengthMinutes],
  )
  const allSlots = useMemo(() => flattenSlots(windowSlots), [windowSlots])

  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [hinted, setHinted] = useState(null)
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
      .then((booked) => {
        if (active) setBookedSlots(booked)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        // Showing every slot as open is the safer failure: the slot is only
        // truly held at createOrder, which re-checks server-side anyway.
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
        return {
          time,
          taken,
          past,
          available: !taken && !past,
          angle: clockAngle(time),
          ...to12Hour(time),
        }
      }),
    [allSlots, bookedSlots, selectedDate],
  )

  const visibleSlots = useMemo(
    () => slotStates.filter((s) => s.period === period),
    [slotStates, period],
  )

  /* Each working window becomes its own arc. A window that straddles noon
     (e.g. 9am–1pm) contributes to both faces, so the arc is clipped to
     whichever period is on show. */
  const arcs = useMemo(() => {
    return windowSlots
      .map((slots) => slots.filter((t) => to12Hour(t).period === period))
      .filter((slots) => slots.length > 1)
      .map((slots) => ({
        key: slots[0],
        d: arcPath(clockAngle(slots[0]), clockAngle(slots[slots.length - 1]), MARKER_RADIUS),
      }))
  }, [windowSlots, period])

  const availableCount = slotStates.filter((s) => s.available).length
  const fullyBooked = !loading && allSlots.length > 0 && availableCount === 0
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

  // Open on whichever half of the day actually has openings, once per date,
  // so the clock never greets someone with a fully dimmed face.
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
  const animateHandTo = useCallback((deg) => {
    if (!handRef.current) return
    const from = handAngle.current.deg
    let delta = ((deg - from + 180) % 360) - 180
    if (delta < -180) delta += 360
    const to = from + delta

    gsap.killTweensOf(handAngle.current)
    const apply = () =>
      handRef.current?.setAttribute('transform', `rotate(${handAngle.current.deg} ${CENTER} ${CENTER})`)

    // The hand's angle is the only cue that depends on the tween running, so
    // without this it would keep pointing at the previous slot.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    animateHandTo(clockAngle(selectedTime))
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
  const selectSlot = useCallback(
    (slot) => {
      if (!slot.available) {
        setHinted(slot.time)
        return
      }
      setHinted(null)
      onChange({ date: selectedDate, time: slot.time })
    },
    [onChange, selectedDate],
  )

  const changePeriod = (next) => {
    setPeriod(next)
    setHinted(null)
    // Otherwise the hand keeps pointing at an hour that now means a different
    // time of day — better to ask for one more tap than to reinterpret it.
    if (selectedTime && to12Hour(selectedTime).period !== next) {
      onChange({ date: selectedDate, time: null })
    }
  }

  const selectDate = (dateKey) => {
    setHinted(null)
    onChange({ date: dateKey, time: null })
  }

  /* --------------------------- drag on the handle ------------------------- */
  const nearestAvailable = useCallback(
    (deg) => {
      const raw = ((deg % 360) + 360) % 360
      let best = null
      let bestDist = Infinity
      visibleSlots.forEach((s) => {
        if (!s.available) return
        const d = Math.abs(((s.angle - raw + 180) % 360) - 180)
        if (d < bestDist) {
          bestDist = d
          best = s
        }
      })
      return best
    },
    [visibleSlots],
  )

  const handlePointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = dialRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const angleAt = (ev) => (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90

    const move = (ev) => {
      const s = nearestAvailable(angleAt(ev))
      if (!s) return
      handAngle.current.deg = s.angle
      handRef.current?.setAttribute('transform', `rotate(${s.angle} ${CENTER} ${CENTER})`)
    }
    const up = (ev) => {
      const s = nearestAvailable(angleAt(ev))
      if (s) selectSlot(s)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const selectedInPeriod = selectedTime && to12Hour(selectedTime).period === period
  const handlePos = pointAt(selectedTime ? clockAngle(selectedTime) : 0, MARKER_RADIUS)

  return (
    <div className="min-w-0">
      <p className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
        Appointment Date &amp; Time
      </p>
      <p className="mb-4 text-xs leading-relaxed text-ink-faint">
        Pick a day, choose AM or PM, then tap a time on the clock.
      </p>

      {/* ------------------------------ date strip ----------------------------- */}
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
        <div ref={dialRef} className="relative aspect-square w-full max-w-[320px]" aria-busy={loading}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <circle cx={CENTER} cy={CENTER} r={TICK_OUTER + 1.5} fill="none" stroke="var(--accent-strong)" strokeWidth="0.5" opacity="0.55" />

            {/* Minute ticks, hour marks longer */}
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
                  opacity={isHour ? 0.6 : 0.22}
                  strokeLinecap="round"
                />
              )
            })}

            {/* One band per working window — the gap between them is simply
                nothing, not a marked-out break. */}
            {arcs.map((arc) => (
              <path
                key={arc.key}
                d={arc.d}
                fill="none"
                stroke="var(--accent-strong)"
                strokeWidth="2.6"
                opacity="0.16"
                strokeLinecap="round"
              />
            ))}

            <g
              ref={handRef}
              transform={`rotate(0 ${CENTER} ${CENTER})`}
              style={{ opacity: selectedInPeriod ? 1 : 0, transition: 'opacity 300ms' }}
            >
              <line
                x1={CENTER}
                y1={CENTER + 4}
                x2={CENTER}
                y2={CENTER - MARKER_RADIUS + 6}
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
            <circle cx={CENTER} cy={CENTER} r="1.5" fill="var(--accent)" opacity={selectedInPeriod ? 1 : 0.35} />

            {/* Decorative numerals — the slots themselves are the buttons */}
            {HOURS.map((h) => {
              const p = pointAt((h % 12) * 30, NUMERAL_RADIUS)
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="6"
                  fill="var(--ink-faint)"
                  opacity="0.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {h}
                </text>
              )
            })}
          </svg>

          {/* Selectable slot markers */}
          {visibleSlots.map((slot) => {
            const p = pointAt(slot.angle, MARKER_RADIUS)
            const isSelected = slot.time === selectedTime
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => selectSlot(slot)}
                onMouseEnter={() => !slot.available && setHinted(slot.time)}
                onMouseLeave={() => setHinted(null)}
                onFocus={() => !slot.available && setHinted(slot.time)}
                onBlur={() => setHinted(null)}
                disabled={loading}
                aria-label={`${formatTimeLabel(slot.time)}${
                  slot.taken ? ' — already booked' : slot.past ? ' — already passed today' : ''
                }`}
                aria-pressed={isSelected}
                aria-disabled={!slot.available}
                className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'h-3.5 w-3.5 bg-accent shadow-[0_0_14px_rgba(232,196,118,0.9)]'
                      : slot.available
                        ? 'h-2 w-2 bg-ink-mute hover:h-3 hover:w-3 hover:bg-accent'
                        : 'h-2 w-2 bg-ink-faint/40 ring-1 ring-ink-faint/25'
                  }`}
                />
              </button>
            )
          })}

          {selectedInPeriod && !loading && (
            <button
              type="button"
              onPointerDown={handlePointerDown}
              aria-label={`Drag to change the time. Currently ${formatTimeLabel(selectedTime)}`}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing"
              style={{ left: `${handlePos.x}%`, top: `${handlePos.y}%` }}
            >
              <span className="pointer-events-none absolute inset-[9px] rounded-full border-2 border-accent/70 bg-accent/10" />
            </button>
          )}

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="mt-[18%] text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {loading
                ? 'Checking…'
                : fullyBooked
                  ? 'No times left'
                  : selectedTime
                    ? formatTimeLabel(selectedTime)
                    : 'Tap a time'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col" role="group" aria-label="Choose morning or afternoon">
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
        {hinted && (
          <span className="rounded-full border border-line px-2.5 py-1 text-ink-faint">
            {formatTimeLabel(hinted)} —{' '}
            {slotStates.find((s) => s.time === hinted)?.taken ? 'Taken' : 'Already passed'}
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
