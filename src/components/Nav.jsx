import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DETAILED_FILE_PATH, LOGO_SRC, SECTIONS } from '../data.js'
import { useSectionNav } from '../lib/sectionNav.js'
import { MoonIcon, SunIcon } from './Icons.jsx'

export default function Nav({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const goToSection = useSectionNav()
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const go = (id) => {
    setMenuOpen(false)
    goToSection(id)
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled || pathname !== '/' ? 'bg-canvas/80 backdrop-blur-md border-b border-line' : 'bg-transparent'
        }`}
      >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"
      >
        <Link
          to="/"
          onClick={(e) => { if (pathname === '/') { e.preventDefault(); go('home') } }}
          aria-label="Supriya — home"
          className="flex items-center gap-2 font-display text-2xl font-semibold tracking-wide text-ink-hi"
        >
          {logoFailed ? (
            /* [OPEN ITEM] Placeholder shown only when no logo file is present */
            <span aria-hidden="true" className="text-accent">✦</span>
          ) : (
            <img
              src={LOGO_SRC}
              onError={() => setLogoFailed(true)}
              alt=""
              width="36"
              height="36"
              className="h-9 w-9 object-contain"
            />
          )}
          Supriya
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop links */}
          <ul className="hidden items-center gap-7 md:flex">
            {SECTIONS.filter((s) => s.id !== 'home').map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => { e.preventDefault(); go(s.id) }}
                  className="text-sm font-medium text-ink transition-colors hover:text-accent"
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={DETAILED_FILE_PATH}
                className="text-sm font-medium text-ink transition-colors hover:text-accent"
              >
                Detailed File
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => go('book')}
                className="rounded-full border border-accent-strong/60 px-4 py-1.5 text-sm font-medium text-accent transition-all hover:border-accent-strong hover:bg-accent-strong/10"
              >
                Book Now
              </button>
            </li>
          </ul>

          {/* Light / dark toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent-strong/60 hover:text-accent"
          >
            {theme === 'light' ? <MoonIcon className="h-4.5 w-4.5" /> : <SunIcon className="h-4.5 w-4.5" />}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={`h-px w-6 bg-ink-hi transition-transform duration-300 ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`}
            />
            <span
              className={`h-px w-6 bg-ink-hi transition-transform duration-300 ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`}
            />
          </button>
        </div>
        </nav>
      </header>

      {/* Mobile overlay menu — deliberately a SIBLING of <header>, not a child:
          once scrolled the header gets a backdrop-filter, which would make it
          the containing block for this fixed element and collapse it to the
          header's own height. */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-[65px] z-40 flex flex-col overflow-y-auto bg-canvas/95 backdrop-blur-lg transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-2 px-8 pt-10">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => { e.preventDefault(); go(s.id) }}
                tabIndex={menuOpen ? 0 : -1}
                className="block py-3 font-display text-3xl font-medium text-ink-hi transition-colors hover:text-accent"
              >
                {s.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to={DETAILED_FILE_PATH}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="block py-3 font-display text-3xl font-medium text-ink-hi transition-colors hover:text-accent"
            >
              Detailed File
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
