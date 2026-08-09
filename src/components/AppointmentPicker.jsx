import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  fetchAvailability,
  formatAppointment,
  formatTimeLabel,
  generateSlots,
  getUpcomingDays,
  isSlotInPast,
} from '../lib/scheduling.js'

/* Dial geometry, in the SVG's 0–100 user space. Slots are spread evenly around
   the full circle rather than mapped to true clock angles — with a lunch gap in
   the middle, real clock positions would leave a lopsided void and squeeze the
   afternoon into a quarter of the ring. Even spacing reads as a dial and
   deliberately echoes the hero's zodiac wheel. */
const RADIUS = 37
const CENTER = 50

const polar = (index, total) => {
  const deg = -90 + index * (360 / total)
  const rad = (deg * Math.PI) / 180
  return {
    deg,
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  }
}

export default function AppointmentPicker({ value, onChange, errorMessage, refreshToken = 0 }) {
  const days = useMemo(() => getUpcomingDays(), [])
  const allSlots = useMemo(() => generateSlots(), [])

  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [hintedSlot, setHintedSlot] = useState(null)

  const selectedDate = value?.date ?? null
  const selectedTime = value?.time ?? null

  const dialRef = useRef(null)
  const handRef = useRef(null)
  const handAngle = useRef({ deg: 0 })

  // Start on the first working day so the dial is visible immediately rather
  // than hiding the whole feature behind an extra tap.
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
        // Never strand the visitor: fall back to showing every slot as open so
        // they can still complete the booking over WhatsApp.
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
        return { time, taken, past, available: !taken && !past }
      }),
    [allSlots, bookedSlots, selectedDate],
  )

  const availableCount = slotStates.filter((s) => s.available).length
  const fullyBooked = !loading && availableCount === 0

  const nextDay = useMemo(() => {
    const i = days.findIndex((d) => d.key === selectedDate)
    return i >= 0 && i < days.length - 1 ? days[i + 1] : null
  }, [days, selectedDate])

  /* --------------------------- hand animation ---------------------------- */
  const animateHandTo = useCallback(
    (index, { immediate = false } = {}) => {
      if (index < 0 || !handRef.current) return
      const targetDeg = index * (360 / allSlots.length)
      const from = handAngle.current.deg
      // Rotate the short way round so the hand never sweeps the long arc.
      let delta = ((targetDeg - from + 180) % 360) - 180
      if (delta < -180) delta += 360
      const to = from + delta

      gsap.killTweensOf(handAngle.current)
      const apply = () =>
        handRef.current?.setAttribute(
          'transform',
          `rotate(${handAngle.current.deg} ${CENTER} ${CENTER})`,
        )

      // Jump straight to the answer when motion is unwanted or unavailable.
      // The hand's angle is the only indicator that depends on the tween
      // actually running, so without this it silently points at the previously
      // selected slot — wrong information, not just a missing flourish.
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
        // Guarantee the exact resting angle even if the tween is interrupted.
        onComplete: () => {
          handAngle.current.deg = to
          apply()
        },
      })
    },
    [allSlots.length],
  )

  useEffect(() => {
    const i = allSlots.indexOf(selectedTime)
    if (i >= 0) animateHandTo(i)
  }, [selectedTime, allSlots, animateHandTo])

  // Dial fades/scales in whenever a new date is loaded in.
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
    (time) => {
      const state = slotStates.find((s) => s.time === time)
      if (!state?.available) {
        setHintedSlot(time)
        return
      }
      setHintedSlot(null)
      onChange({ date: selectedDate, time })
    },
    [slotStates, onChange, selectedDate],
  )

  const selectDate = (dateKey) => {
    setHintedSlot(null)
    onChange({ date: dateKey, time: null })
  }

  /* -------------------------- drag on the handle -------------------------- */
  // Drag is bound to the handle knob only, not the whole dial. Making the full
  // circle a drag surface would need `touch-action: none` across an element
  // that spans most of a phone screen, turning the dial into a scroll trap.
  const nearestAvailableIndex = useCallback(
    (deg) => {
      const step = 360 / allSlots.length
      const raw = ((deg % 360) + 360) % 360
      let best = -1
      let bestDist = Infinity
      slotStates.forEach((s, i) => {
        if (!s.available) return
        const slotDeg = i * step
        const d = Math.abs(((slotDeg - raw + 180) % 360) - 180)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      return best
    },
    [allSlots.length, slotStates],
  )

  const handlePointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    const rect = dialRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const move = (ev) => {
      const deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
      const i = nearestAvailableIndex(deg)
      if (i >= 0) {
        handAngle.current.deg = i * (360 / allSlots.length)
        handRef.current?.setAttribute(
          'transform',
          `rotate(${handAngle.current.deg} ${CENTER} ${CENTER})`,
        )
      }
    }

    const up = (ev) => {
      const deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
      const i = nearestAvailableIndex(deg)
      if (i >= 0) selectSlot(allSlots[i])
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const selectedIndex = allSlots.indexOf(selectedTime)
  const handlePos = polar(selectedIndex >= 0 ? selectedIndex : 0, allSlots.length)

  return (
    <div className="min-w-0">
      <p className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
        Appointment Date &amp; Time
      </p>
      <p className="mb-4 text-xs leading-relaxed text-ink-faint">
        When would you like the session itself to happen?
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
              aria-label={d.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              className={`flex min-w-[62px] shrink-0 snap-start flex-col items-center rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                active
                  ? 'border-accent-strong bg-accent-strong/15 text-accent shadow-[0_0_18px_rgba(212,169,78,0.25)]'
                  : 'border-line bg-card text-ink hover:border-accent-strong/50 hover:text-accent'
              }`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                {d.weekday}
              </span>
              <span className="mt-0.5 font-display text-xl font-semibold leading-none">
                {d.dayNumber}
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">
                {d.month}
              </span>
            </button>
          )
        })}
      </div>

      {/* --------------------------------- dial --------------------------------- */}
      <div className="mt-6 flex flex-col items-center">
        <div
          ref={dialRef}
          className="relative aspect-square w-full max-w-[300px]"
          aria-busy={loading}
        >
          {/* Decorative rings — same visual language as the hero zodiac wheel */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 7}
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth="0.4"
              opacity="0.5"
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS - 7}
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth="0.25"
              opacity="0.28"
            />
            {/* Spokes, echoing the 12 divisions of the zodiac wheel */}
            {allSlots.map((_, i) => {
              const a = polar(i, allSlots.length)
              const rad = (a.deg * Math.PI) / 180
              return (
                <line
                  key={i}
                  x1={CENTER + (RADIUS - 7) * Math.cos(rad)}
                  y1={CENTER + (RADIUS - 7) * Math.sin(rad)}
                  x2={CENTER + (RADIUS + 7) * Math.cos(rad)}
                  y2={CENTER + (RADIUS + 7) * Math.sin(rad)}
                  stroke="var(--accent-strong)"
                  strokeWidth="0.2"
                  opacity="0.18"
                />
              )
            })}

            {/* The hand — rotated by GSAP, hidden until a slot is chosen */}
            <g
              ref={handRef}
              transform={`rotate(0 ${CENTER} ${CENTER})`}
              style={{ opacity: selectedTime ? 1 : 0, transition: 'opacity 300ms' }}
            >
              {/* Starts outside the centre label rather than at dead centre —
                  a full-length hand slices straight through the time text. */}
              <line
                x1={CENTER}
                y1={CENTER - 18}
                x2={CENTER}
                y2={CENTER - RADIUS + 2}
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* Slot notches — real buttons, so tap and keyboard both work natively */}
          {slotStates.map((slot, i) => {
            const pos = polar(i, allSlots.length)
            const isSelected = slot.time === selectedTime
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => selectSlot(slot.time)}
                onMouseEnter={() => !slot.available && setHintedSlot(slot.time)}
                onMouseLeave={() => setHintedSlot(null)}
                onFocus={() => !slot.available && setHintedSlot(slot.time)}
                onBlur={() => setHintedSlot(null)}
                disabled={loading}
                aria-label={`${formatTimeLabel(slot.time)}${
                  slot.taken ? ' — already booked' : slot.past ? ' — no longer available' : ''
                }`}
                aria-pressed={isSelected}
                aria-disabled={!slot.available}
                className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'h-3.5 w-3.5 bg-accent shadow-[0_0_14px_rgba(232,196,118,0.9)]'
                      : slot.available
                        ? 'h-2 w-2 bg-ink-mute hover:h-3 hover:w-3 hover:bg-accent'
                        : 'h-2 w-2 bg-ink-faint/45 ring-1 ring-ink-faint/30'
                    }`}
                />
              </button>
            )
          })}

          {/* Draggable handle — sits on the selected notch */}
          {selectedTime && !loading && (
            <button
              type="button"
              onPointerDown={handlePointerDown}
              aria-label={`Drag to change time. Currently ${formatTimeLabel(selectedTime)}`}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing"
              style={{ left: `${handlePos.x}%`, top: `${handlePos.y}%` }}
            >
              <span className="pointer-events-none absolute inset-[9px] rounded-full border-2 border-accent bg-accent/25 backdrop-blur-sm" />
            </button>
          )}

          {/* Dial centre: the chosen time, or the current status */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {loading ? (
              <span className="text-xs uppercase tracking-[0.2em] text-ink-mute">Checking…</span>
            ) : selectedTime ? (
              <>
                <span className="font-display text-3xl font-semibold text-ink-hi">
                  {formatTimeLabel(selectedTime).split(' ')[0]}
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-accent">
                  {formatTimeLabel(selectedTime).split(' ')[1]}
                </span>
              </>
            ) : (
              <span className="max-w-[110px] text-xs leading-relaxed text-ink-mute">
                {fullyBooked ? 'No times left' : 'Pick a time'}
              </span>
            )}
          </div>
        </div>

        {/* "Taken" hint for whichever unavailable notch is hovered/tapped */}
        <p className="mt-3 h-5 text-center text-xs text-ink-mute" aria-live="polite">
          {hintedSlot && (
            <span className="rounded-full border border-line px-2.5 py-1 text-ink-faint">
              {formatTimeLabel(hintedSlot)} — Taken
            </span>
          )}
        </p>

        {/* Plain-text confirmation of the choice */}
        <p className="mt-1 text-center text-sm font-medium text-ink-hi" aria-live="polite">
          {selectedTime
            ? formatAppointment(selectedDate, selectedTime)
            : <span className="text-ink-mute">No time selected yet</span>}
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
      </div>

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
          onChange={(e) => selectSlot(e.target.value)}
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
