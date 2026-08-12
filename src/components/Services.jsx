import { SERVICES } from '../data.js'
import { ServiceIcon } from './Icons.jsx'

export default function Services({ onBook }) {
  return (
    <section id="services" aria-label="Services" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
            03 · Services
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-ink-hi sm:text-5xl" data-reveal>
            Paths to <span className="text-gold-shimmer">Clarity</span>
          </h2>
        </div>

        {/* Clean grid per wireframe 1a — 2 columns from mobile up, 3 on desktop */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <article
              key={service.id}
              data-reveal
              className="group flex flex-col rounded-2xl border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-strong/45 hover:bg-card-hover hover:shadow-[0_18px_50px_-18px_rgba(212,169,78,0.35)] sm:p-7"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-strong/40 bg-accent-strong/10 text-accent transition-all duration-300 group-hover:bg-accent-strong/20 group-hover:shadow-[0_0_22px_rgba(212,169,78,0.45)] sm:h-13 sm:w-13">
                <ServiceIcon name={service.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <h3 className="mt-4 text-xl font-semibold leading-snug text-ink-hi sm:text-2xl">
                {service.name}
              </h3>
              <p className="mt-1 text-sm font-semibold tracking-wide text-accent">{service.price}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {service.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-ink sm:text-sm">
                    <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m2.5 8.5 3.5 3.5 7.5-8" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onBook(service.name)}
                className="mt-6 w-full rounded-full border border-accent-strong/50 py-2.5 text-sm font-semibold text-accent transition-all duration-300 hover:bg-accent-fill hover:text-accent-fill-ink"
              >
                Book This
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
