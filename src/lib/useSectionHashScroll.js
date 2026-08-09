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
    // No extra frame wait needed: useEffect already runs after the browser
    // has painted the newly-mounted page, so layout is settled by the time
    // this fires. The previous rAF wrapper added a dependency on animation
    // frames actually being scheduled, which a backgrounded/throttled tab
    // can stall indefinitely — silently stranding the visitor at the top.
    scrollToSection(hash.slice(1))
  }, [hash])
}
