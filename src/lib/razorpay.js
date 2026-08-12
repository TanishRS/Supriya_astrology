const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/* Matches --accent-strong. Checkout renders in Razorpay's own iframe, so the
   site's CSS variables can't reach it — the hex has to be passed explicitly. */
export const CHECKOUT_THEME_COLOR = '#d4a94e'

let loader = null

/**
 * Loads Checkout on demand rather than on page load, so visitors who never
 * book don't pay for the script. The promise is cached, so repeated booking
 * attempts reuse the one tag instead of stacking up duplicates.
 */
export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Checkout loaded but unavailable')))
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      loader = null
      script.remove()
      reject(new Error('Could not load the payment window'))
    }
    document.head.appendChild(script)
  })
  return loader
}

/**
 * Opens Checkout and resolves once the customer either pays or dismisses.
 *
 *   { paid: true, response }  — handler fired, signature values in `response`
 *   { paid: false }           — modal closed without paying, not an error
 *
 * Both outcomes resolve rather than reject: a dismissed modal is an ordinary
 * thing for someone to do, and treating it as a failure would surface a scary
 * message for what is really just "changed my mind".
 */
export async function openCheckout({ keyId, orderId, amount, currency, name, description, prefill }) {
  const Razorpay = await loadCheckout()

  return new Promise((resolve, reject) => {
    let settled = false
    const settle = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    try {
      const rzp = new Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name,
        description,
        prefill,
        theme: { color: CHECKOUT_THEME_COLOR },
        handler: (response) => settle({ paid: true, response }),
        modal: { ondismiss: () => settle({ paid: false }) },
      })
      rzp.on?.('payment.failed', (e) =>
        settle({ paid: false, failure: e?.error?.description ?? null }),
      )
      rzp.open()
    } catch (err) {
      reject(err)
    }
  })
}
