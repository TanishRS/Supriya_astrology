import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToSection } from './scroll.js'

/* Pairs with useSectionNav: when a cross-page link lands on HomePage with a
   #hash (e.g. coming from /detailed-file via "Book Now"), scroll to that
   section once mounted instead of leaving the visitor at the top. */
export function useSectionHashScroll() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    // Wait a frame so the freshly-mounted page has laid out before measuring it
    const raf = requestAnimationFrame(() => scrollToSection(id))
    return () => cancelAnimationFrame(raf)
  }, [hash])
}
