import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/* Shared shell for the long-form legal routes (/privacy, /terms). Both pages
   are the same shape — centred header over the cosmic backdrop, then a single
   narrow column of numbered sections — so the layout lives here and each page
   file carries only its own copy.

   Deliberately no [data-reveal] hooks: on a wall of legal text, fading in
   paragraph by paragraph on scroll gets tiresome fast, and it would also mean
   the text is invisible until GSAP runs. */
export default function LegalPage({ documentTitle, eyebrow, title, updated, intro, sections }) {
  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  return (
    <div>
      {/* Page header */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="cosmic-gradient absolute inset-0" aria-hidden="true" />
        <div className="starfield absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Link
            to="/"
            className="mb-6 inline-block text-xs font-medium uppercase tracking-[0.3em] text-ink-mute transition-colors hover:text-accent"
          >
            ← Back to Home
          </Link>

          <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.15] text-ink-hi sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-sm text-ink-mute">{updated}</p>
        </div>
      </section>

      {/* Body — max-w-2xl keeps the measure near 70 characters instead of
          letting it run the full width of a desktop window. */}
      <section aria-label={title} className="starfield relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-2xl px-6">
          <div className="space-y-4 border-b border-line pb-10">
            {intro.map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-ink">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 space-y-11">
            {sections.map(({ n, heading, paragraphs }) => (
              <section key={n} id={`section-${n}`} aria-labelledby={`heading-${n}`}>
                <h2
                  id={`heading-${n}`}
                  className="text-xl font-semibold leading-snug text-ink-hi sm:text-2xl"
                >
                  <span className="text-accent">{n}.</span> {heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {paragraphs.map((paragraph, i) => (
                    <p key={i} className="text-base leading-relaxed text-ink">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
