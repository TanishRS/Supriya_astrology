/* Native smooth anchor scrolling. GSAP's ScrollToPlugin is deliberately NOT
   used here: it conflicts with `html { scroll-behavior: smooth }` (the browser
   re-smooths every tween step, so the scroll crawls or stalls entirely). */
export function scrollToSection(id) {
  const target = document.getElementById(id)
  if (!target) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
}
