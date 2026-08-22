/* Sale-price display: struck-through "was" figure alongside the live price.

   Both numbers are presentational. The amount actually charged is decided by
   the backend and never read from here — see the note on SERVICES in data.js.

   On the service cards the two figures sit inline from `sm` up, and stack on
   phones. That stacking is deliberate rather than a fallback: the cards are a
   two-up grid, so the inner column is only ~110px on a 360px screen, and the
   longest pair (Rs. 50,001 / Rs. 21,000) needs ~128px inline at readable
   sizes. Letting them wrap naturally put four of the six cards on two lines
   and two on one, which read as a mistake. Stacking every card keeps the row
   uniform, and gap-y-0 with tight leading keeps the pair reading as one price
   block rather than two separate rows.

   The "Was"/"now" labels are screen-reader only: a bare <s> is not reliably
   announced, so without them the two figures are read out as an ambiguous
   pair of prices. */
export default function PriceTag({ originalPrice, price, size = 'card', className = '' }) {
  const hero = size === 'hero'

  const layout = hero
    ? 'flex-wrap items-baseline gap-x-2.5 gap-y-0.5'
    : 'flex-col items-start gap-y-0 leading-tight sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5'

  return (
    <span className={`inline-flex ${layout} ${className}`}>
      <span className="sr-only">Was </span>
      <s
        className={`font-medium text-ink-faint decoration-1 ${hero ? 'text-sm sm:text-lg' : 'text-[11px] sm:text-xs'}`}
      >
        {originalPrice}
      </s>
      <span className="sr-only">, now </span>
      <span
        className={`font-semibold tracking-wide text-accent ${hero ? 'text-2xl sm:text-3xl' : 'text-sm'}`}
      >
        {price}
      </span>
    </span>
  )
}
