import { toDateKey } from './scheduling.js'

/* An unbounded <input type="date"> is only half-validated. The day and month
   segments clamp themselves (you can't reach 32 or 14), but the YEAR does not —
   3333 is accepted without complaint, as is any date in the future, neither of
   which can be a birth date. Without these bounds the form submits happily and
   the problem only surfaces later on Razorpay's page, which is far too late.
   Setting min/max makes the browser block submission at the source. */
export const BIRTH_DATE_MIN = '1900-01-01'

/** Today, in the input's local YYYY-MM-DD format. Nobody is born tomorrow. */
export function birthDateMax() {
  return toDateKey(new Date())
}
