import { TESTIMONIALS } from '../data.js'
import { StarRating } from './Icons.jsx'

export default function Testimonials() {
  return (
    <section id="testimonials" aria-label="Testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
            05 · Testimonials
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-ink-hi sm:text-5xl" data-reveal>
            Words from <span className="text-gold-shimmer">Seekers</span>
          </h2>
        </div>

        {/* Row of 3 cards on desktop (per 1a) — swipeable snap carousel on mobile */}
        <div
          className="snap-carousel mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
          data-reveal
        >
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="flex min-w-[82%] snap-center flex-col rounded-2xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent-strong/40 sm:min-w-[60%] md:min-w-0"
            >
              <StarRating />
              <blockquote className="mt-5 flex-1">
                <p className="font-display text-xl leading-relaxed text-ink-hi sm:text-2xl">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>
              {/* [OPEN ITEM] No author names supplied — labelled "Verified Client" */}
              <figcaption className="mt-6 flex items-center gap-2 text-sm text-ink-mute">
                <span aria-hidden="true" className="text-accent">✦</span>
                {t.author}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-ink-faint md:hidden" aria-hidden="true">
          Swipe to read more →
        </p>
      </div>
    </section>
  )
}
