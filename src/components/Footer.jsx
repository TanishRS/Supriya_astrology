import { Link } from 'react-router-dom'
import {
  INSTAGRAM_URL,
  PRIVACY_PATH,
  TERMS_PATH,
  WEBSITE_LABEL,
  WEBSITE_URL,
  WHATSAPP_URL,
} from '../data.js'
import { useSectionNav } from '../lib/sectionNav.js'
import { GlobeIcon, InstagramIcon, WhatsAppIcon } from './Icons.jsx'

export default function Footer() {
  // The Book/Testimonials/etc. anchors only exist on the home route, so from
  // any other page (e.g. /detailed-file) this needs to navigate home first.
  const goToSection = useSectionNav()

  return (
    <footer id="contact" aria-label="Contact" className="relative overflow-hidden pt-24 sm:pt-32">
      <div className="footer-glow absolute inset-x-0 bottom-0 h-[420px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
          06 · Contact
        </p>
        <h2 className="mt-4 text-4xl font-semibold text-ink-hi sm:text-5xl" data-reveal>
          Begin Your <span className="text-gold-shimmer">Journey</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-ink-mute" data-reveal>
          Reach out directly, or book your consultation — every session is personal.
        </p>

        {/* Repeat CTAs */}
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row" data-reveal>
          <button
            type="button"
            onClick={() => goToSection('book')}
            className="w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 sm:w-auto"
          >
            Book Consultation
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-8 py-3.5 text-sm font-semibold text-ink-hi transition-all duration-300 hover:border-accent-strong/70 hover:text-accent sm:w-auto"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Contact links */}
        <ul className="mt-12 flex flex-col items-center justify-center gap-4 text-sm text-ink sm:flex-row sm:gap-9" data-reveal>
          <li>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <WhatsAppIcon className="h-4 w-4 text-accent" />
              +91 96196 35666
            </a>
          </li>
          <li>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <InstagramIcon className="h-4 w-4 text-accent" />
              @astronumerodecode
            </a>
          </li>
          {/* [OPEN ITEM] Source doc listed this under "Email", but it is a website
              URL — shown as a website link; a real email address is still needed. */}
          <li>
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <GlobeIcon className="h-4 w-4 text-accent" />
              {WEBSITE_LABEL}
            </a>
          </li>
        </ul>
      </div>

      <div className="relative mt-16 border-t border-line py-7">
        {/* Legal links sit on their own row rather than joining the copyright
            line below — three items across that row would crowd badly on
            tablet widths, given how long the modality list already is. */}
        <nav
          aria-label="Legal"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-6 text-xs text-ink-faint"
        >
          <Link to={PRIVACY_PATH} className="transition-colors hover:text-accent">
            Privacy Policy
          </Link>
          <Link to={TERMS_PATH} className="transition-colors hover:text-accent">
            Terms and Conditions
          </Link>
        </nav>

        <div className="mx-auto mt-5 flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Supriya. All rights reserved.</p>
          <p className="text-center">
            Astrology · Tarot · Numerology · Vastu · Reiki · Akashic Records · Inner Child Healing
          </p>
        </div>
      </div>
    </footer>
  )
}
