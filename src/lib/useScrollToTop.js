import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* React Router does not reset scroll position on navigation the way a real
   page load does. A visitor scrolled down near the bottom of Home (e.g. the
   Contact section) who clicks "Detailed File" in the nav lands at that same
   pixel offset on the new page — which, being shorter, can dump them at or
   past its bottom instead of the top.

   Hash navigations are deliberately excluded here: '/#book' from the Detailed
   File page is handled by useSectionHashScroll, which scrolls to that section
   once Home has mounted. This hook only owns the plain, no-hash case. */
export function useScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    // Explicit 'instant' matters: html has `scroll-behavior: smooth` globally,
    // so a bare scrollTo(0, 0) inherits that and animates instead of jumping —
    // and if the browser is at all busy the instant a new route mounts (which
    // it often is), that animation can stall or get dropped entirely, leaving
    // the visitor stuck mid-page. A route change should snap like a real page
    // load, not animate.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
}
