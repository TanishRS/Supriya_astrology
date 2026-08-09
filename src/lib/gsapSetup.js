// Side-effect module: registers GSAP plugins once, before any component that
// uses ScrollTrigger mounts. Import this for its effect only (`import './lib/gsapSetup.js'`).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
