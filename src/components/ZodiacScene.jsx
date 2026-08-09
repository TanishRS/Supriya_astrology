import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

/* Per-theme palette for the scene. On the light canvas the gold has to darken
   and the "stars" become deep violet specks, or nothing would be visible. */
const PALETTES = {
  dark: {
    glyph: '#e8c476',
    glyphGlow: 'rgba(232, 196, 118, 0.9)',
    ring: '#d4a94e',
    ringOpacity: 0.65,
    innerRingOpacity: 0.3,
    spokeOpacity: 0.22,
    core: '#7c5cff',
    coreOpacity: 0.38,
    starA: '#ffffff',
    starB: '#e8c476',
    starOpacity: 0.75,
    glow: ['rgba(124, 92, 255, 0.55)', 'rgba(76, 58, 148, 0.22)', 'rgba(76, 58, 148, 0)'],
  },
  light: {
    glyph: '#8f6b1d',
    glyphGlow: 'rgba(143, 107, 29, 0.35)',
    ring: '#a37c22',
    ringOpacity: 0.85,
    innerRingOpacity: 0.45,
    spokeOpacity: 0.3,
    core: '#7c5cff',
    coreOpacity: 0.3,
    starA: '#4c3a94',
    starB: '#a37c22',
    starOpacity: 0.5,
    glow: ['rgba(124, 92, 255, 0.16)', 'rgba(124, 92, 255, 0.07)', 'rgba(124, 92, 255, 0)'],
  },
}

// U+FE0E forces text presentation — without it macOS/iOS draw these as color emoji
const TEXT_PRESENTATION = '︎'

function makeGlyphTexture(glyph, palette) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = '84px "Cormorant Garamond", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = palette.glyphGlow
  ctx.shadowBlur = 18
  ctx.fillStyle = palette.glyph
  ctx.fillText(glyph + TEXT_PRESENTATION, size / 2, size / 2 + 6)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeGlowTexture(palette) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, palette.glow[0])
  g.addColorStop(0.4, palette.glow[1])
  g.addColorStop(1, palette.glow[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

export default function ZodiacScene({ theme = 'dark' }) {
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)

  // Textures are baked per palette, so the scene rebuilds when the theme flips
  useEffect(() => {
    const palette = PALETTES[theme] ?? PALETTES.dark
    const container = containerRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return undefined // WebGL unavailable — the CSS gradient fallback stays visible
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120)
    camera.position.z = 24

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    container.appendChild(renderer.domElement)

    const disposables = []
    const track = (obj) => { disposables.push(obj); return obj }

    /* --- Zodiac wheel group --- */
    const wheel = new THREE.Group()
    wheel.rotation.x = -0.42
    scene.add(wheel)

    const ringColor = new THREE.Color(palette.ring)
    const coreColor = new THREE.Color(palette.core)

    const outerRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(9.2, 0.03, 8, 180)),
      track(new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: palette.ringOpacity })),
    )
    const innerRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(7.3, 0.016, 8, 160)),
      track(new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: palette.innerRingOpacity })),
    )
    wheel.add(outerRing, innerRing)

    // 12 spokes between the rings
    const spokePoints = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      spokePoints.push(
        new THREE.Vector3(Math.cos(a) * 7.3, Math.sin(a) * 7.3, 0),
        new THREE.Vector3(Math.cos(a) * 9.2, Math.sin(a) * 9.2, 0),
      )
    }
    const spokes = new THREE.LineSegments(
      track(new THREE.BufferGeometry().setFromPoints(spokePoints)),
      track(new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: palette.spokeOpacity })),
    )
    wheel.add(spokes)

    // 12 zodiac glyph sprites between the rings
    GLYPHS.forEach((glyph, i) => {
      const a = ((i + 0.5) / 12) * Math.PI * 2
      const sprite = new THREE.Sprite(
        track(new THREE.SpriteMaterial({ map: track(makeGlyphTexture(glyph, palette)), transparent: true, opacity: 0.9 })),
      )
      sprite.position.set(Math.cos(a) * 8.25, Math.sin(a) * 8.25, 0)
      sprite.scale.setScalar(1.15)
      wheel.add(sprite)
    })

    // Inner celestial polyhedron, counter-rotating
    const core = new THREE.Mesh(
      track(new THREE.IcosahedronGeometry(3.1, 1)),
      track(new THREE.MeshBasicMaterial({ color: coreColor, wireframe: true, transparent: true, opacity: palette.coreOpacity })),
    )
    scene.add(core)

    // Soft glow behind everything
    const glow = new THREE.Sprite(
      track(new THREE.SpriteMaterial({ map: track(makeGlowTexture(palette)), transparent: true, depthWrite: false })),
    )
    glow.position.z = -6
    glow.scale.setScalar(34)
    scene.add(glow)

    /* --- Starfield --- */
    const starCount = 1300
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const starColorA = new THREE.Color(palette.starA)
    const starColorB = new THREE.Color(palette.starB)
    for (let i = 0; i < starCount; i++) {
      const r = 20 + Math.random() * 45
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 4
      const c = Math.random() < 0.15 ? starColorB : starColorA
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    const starGeometry = track(new THREE.BufferGeometry())
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const stars = new THREE.Points(
      starGeometry,
      track(new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: palette.starOpacity, depthWrite: false })),
    )
    scene.add(stars)

    /* --- Sizing --- */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    /* --- Animation: slow rotation + gentle pointer parallax --- */
    const pointer = { x: 0, y: 0 }
    const onPointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let raf = 0
    let running = true
    const clock = new THREE.Clock()

    const animate = () => {
      if (!running) return
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      wheel.rotation.z += dt * 0.055
      core.rotation.y -= dt * 0.12
      core.rotation.x += dt * 0.05
      stars.rotation.z += dt * 0.004
      // ease camera toward the pointer for subtle parallax
      camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.03
      camera.position.y += (-pointer.y * 0.9 - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    const start = () => {
      if (running) return
      running = true
      clock.start()
      animate()
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Pause when the tab is hidden or the hero is scrolled out of view
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.02 },
    )
    observer.observe(container)

    animate()
    setReady(true)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}
