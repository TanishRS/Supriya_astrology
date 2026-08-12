/* A bare <input type="tel"> accepts absolutely anything — the type only hints
   which on-screen keyboard to show, it does not restrict typing. Letters were
   going straight into the WhatsApp Number field. This keeps the characters a
   phone number can legitimately contain (digits, a leading +, and the usual
   spacing/grouping punctuation) and silently drops the rest as it is typed. */
const ALLOWED = /[^\d+\s()-]/g

export function sanitizePhone(value) {
  return (value ?? '').replace(ALLOWED, '')
}

/**
 * Bare digits for Razorpay's prefill, with the country code removed —
 * Checkout shows its own country selector, so a value still carrying 91 would
 * be read as +91 91XXXXXXXXXX. The site's own placeholder is "+91 98765
 * 43210", so people do type it that way.
 */
export function toDigits(value) {
  const digits = (value ?? '').toString().replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

/**
 * Attach to an uncontrolled phone input's onInput. Rewrites the value in place
 * while preserving the caret, so typing a stray letter mid-number doesn't
 * bounce the cursor to the end.
 */
export function handlePhoneInput(event) {
  const el = event.target
  const cleaned = sanitizePhone(el.value)
  if (cleaned === el.value) return

  const caret = el.selectionStart ?? cleaned.length
  const removedBeforeCaret = el.value.slice(0, caret).length - sanitizePhone(el.value.slice(0, caret)).length
  el.value = cleaned
  const next = Math.max(0, caret - removedBeforeCaret)
  el.setSelectionRange(next, next)
}
