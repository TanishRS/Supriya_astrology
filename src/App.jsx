import { useLayoutEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import DetailedFilePage from './pages/DetailedFilePage.jsx'
import { DETAILED_FILE_PATH } from './data.js'

export default function App() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* private mode — theme just won't persist */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#faf7f0' : '#070617')
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <>
      <a
        href="#book"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold-500 focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-midnight-950"
      >
        Skip to booking
      </a>
      <Nav theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage theme={theme} />} />
          <Route path={DETAILED_FILE_PATH} element={<DetailedFilePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
