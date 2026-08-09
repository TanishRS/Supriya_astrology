import { useNavigate, useLocation } from 'react-router-dom'
import { scrollToSection } from './scroll.js'

/* Section anchors (About, Services, Book, …) only exist on the home route.
   From any other route, "go to a section" has to navigate home first and
   then scroll once the home page has actually mounted — a plain anchor href
   would just 404-scroll on the wrong page. HomePage reads the resulting hash
   via useSectionHashScroll below. */
export function useSectionNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (id) => {
    if (location.pathname === '/') {
      scrollToSection(id)
    } else {
      navigate(`/#${id}`)
    }
  }
}
