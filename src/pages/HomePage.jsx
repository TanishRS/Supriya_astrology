import { useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Services from '../components/Services.jsx'
import BookForm from '../components/BookForm.jsx'
import Testimonials from '../components/Testimonials.jsx'
import ScrollDots from '../components/ScrollDots.jsx'
import { scrollToSection } from '../lib/scroll.js'
import { useSectionHashScroll } from '../lib/useSectionHashScroll.js'

export default function HomePage({ theme }) {
  const [selectedService, setSelectedService] = useState('')
  useSectionHashScroll()

  /* "Book This" pre-selects the service, then scrolls to the form. Matched by
     NAME rather than a local id, because the dropdown's options now come from
     the backend — a name that doesn't match simply leaves it unselected. */
  const handleBook = (serviceName) => {
    setSelectedService(serviceName)
    scrollToSection('book')
  }

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Scroll-triggered reveals, one section block at a time (wireframe 1a rhythm)
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 36,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      // Hero content entrance
      gsap.from('[data-hero-content] > *', {
        y: 28,
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.14,
        ease: 'power2.out',
        delay: 0.15,
      })

      // Subtle parallax: the hero starfield drifts down into the About section
      gsap.to('.starfield-parallax', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: {
          trigger: '#home',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <>
      <ScrollDots />
      <Hero theme={theme} />
      <About />
      <Services onBook={handleBook} />
      <BookForm selectedService={selectedService} onServiceChange={setSelectedService} />
      <Testimonials />
    </>
  )
}
