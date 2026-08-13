/* ===========================================================================
   BOOKING BACKEND (Apps Script web app)
   ---------------------------------------------------------------------------
   The whole booking flow now lives on this one endpoint. Nothing about the
   schedule — working days, hours, slot length, or the services list — is
   hardcoded in the frontend any more; it all arrives from ?action=schedule so
   changing it on the backend changes the site with no redeploy.
   ========================================================================= */

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtdN1qcBZNaprZ-oDmuWkQ9MS5TEOV0CE0xRDVmvQYqa8CuzOh4JPBrRe4-C1Ac4dk/exec'

/* Deliberately not a real secret. It ships in the bundle and is readable by
   anyone who opens devtools — it only filters out casual drive-by abuse. The
   Razorpay Key Secret is the thing that actually matters, and that stays
   server-side in Script Properties where it belongs. */
export const SITE_SECRET = '8fK2mQ9xL7vP4zN6rT1yW3cA0sD5hJ8uB6eR9pX2kM7nV4qZ1tF8gH3wC6jL0sY5aE2dP9iN7xQ4bK8mR'

/* The site is live. Until the URL above is filled in we must never fire a
   request at a placeholder string — the Book section shows a WhatsApp fallback
   instead of a form that cannot possibly work. */
export function isBackendConfigured() {
  return /^https?:\/\//i.test(APPS_SCRIPT_URL)
}

/** Apps Script rejects preflighted requests, so POSTs stay "simple" requests. */
async function postJson(payload, { signal } = {}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

async function getJson(params, { signal } = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${APPS_SCRIPT_URL}?${qs}`, { signal })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

/**
 * { workingDays, workingWindows: [{start,end}, …], slotLengthMinutes, services }
 * Fetched once on load — the single source of truth for the clock and the
 * consultation dropdown.
 */
export async function fetchSchedule({ signal } = {}) {
  const data = await getJson({ action: 'schedule' }, { signal })
  return {
    workingDays: Array.isArray(data?.workingDays) ? data.workingDays : [],
    workingWindows: Array.isArray(data?.workingWindows) ? data.workingWindows : [],
    slotLengthMinutes: Number(data?.slotLengthMinutes) || 30,
    services: Array.isArray(data?.services) ? data.services : [],
  }
}

export async function fetchAvailability(dateKey, { signal } = {}) {
  const data = await getJson({ action: 'availability', date: dateKey }, { signal })
  return Array.isArray(data?.bookedSlots) ? data.bookedSlots : []
}

/**
 * Called only when the customer commits to paying — this is the moment the
 * slot is actually held, so it must not run any earlier.
 * -> { success: true, orderId, amount, currency, keyId } | { success: false, message }
 */
export function createOrder(details, { signal } = {}) {
  return postJson({ action: 'createOrder', siteSecret: SITE_SECRET, ...details }, { signal })
}

/**
 * Signature verification. The three values come back from Checkout as plain JS
 * values in the handler, which is why this is reliable — no header parsing.
 * -> { success: true } | { success: false, message }
 */
export function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  return postJson({
    action: 'verifyPayment',
    siteSecret: SITE_SECRET,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  })
}
