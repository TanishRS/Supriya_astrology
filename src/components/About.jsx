import { useState } from 'react'
import { MODALITIES, PORTRAIT_SRC } from '../data.js'

export default function About() {
  // Falls back to the silhouette if the portrait file is missing, so a
  // not-yet-uploaded photo can never leave a broken image on the page.
  const [portraitFailed, setPortraitFailed] = useState(false)

  return (
    <section id="about" aria-label="About Supriya" className="starfield relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
          02 · About
        </p>
        <h2 className="mt-4 text-4xl font-semibold text-ink-hi sm:text-5xl" data-reveal>
          Guided by the <span className="text-gold-shimmer">Stars</span>
        </h2>

        <div className="mt-12 flex justify-center" data-reveal>
          <div className="relative h-44 w-44 sm:h-52 sm:w-52">
            <div className="absolute -inset-2 rounded-full border border-accent-strong/30" aria-hidden="true" />
            <div className="absolute -inset-5 rounded-full border border-accent-strong/10" aria-hidden="true" />
            <div className="portrait-disc flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-accent-strong/50">
              {portraitFailed ? (
                /* [OPEN ITEM] Placeholder shown only when no portrait file is present */
                <svg
                  viewBox="0 0 100 100"
                  className="mt-6 h-full w-full text-silhouette"
                  role="img"
                  aria-label="Portrait of Supriya coming soon"
                >
                  <circle cx="50" cy="38" r="17" fill="currentColor" opacity="0.85" />
                  <path d="M18 96c3-22 15-33 32-33s29 11 32 33Z" fill="currentColor" opacity="0.85" />
                </svg>
              ) : (
                <img
                  src={PORTRAIT_SRC}
                  onError={() => setPortraitFailed(true)}
                  alt="Supriya, astrology, tarot and energy healing consultant"
                  width="900"
                  height="1199"
                  loading="lazy"
                  decoding="async"
                  /* The shipped file is the uncropped 3:4 portrait, so `cover`
                     inside this square disc trims 25% off the height. 28% down
                     is the window that lands her face in the middle of the
                     circle with headroom above and shoulders anchoring the base. */
                  className="h-full w-full object-cover [object-position:50%_28%]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Bio — verbatim from client */}
        <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed text-ink" data-reveal>
          Hi, I&rsquo;m Supriya. I help people overcome karmic blocks related to health, wealth,
          relationships, and career through Astrology, Tarot, Numerology, Vastu, Reiki, Akashic
          Record Reading, and Inner Child Healing.
        </p>

        {/* 7 modality chips */}
        <ul className="mt-10 flex flex-wrap justify-center gap-3" data-reveal>
          {MODALITIES.map((m) => (
            <li
              key={m}
              className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm text-ink transition-colors duration-300 hover:border-accent-strong/50 hover:text-accent"
            >
              <span aria-hidden="true" className="text-xs text-accent">✦</span>
              {m}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
