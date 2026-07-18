/**
 * GSAP plugin registration — the single place ScrollTrigger is registered.
 *
 * All showcase-v2 code imports { gsap, ScrollTrigger } from this module, never
 * from 'gsap' directly, so registration happens exactly once at module init.
 * This module is intentionally NOT imported from main.ts: the V2 showcase is
 * lazy-loaded, and importing here from the app entry would pull ~45KB gzipped
 * of GSAP into every page's bundle. Because only V2 components import this
 * module, GSAP ships inside the async showcase-v2 chunk instead.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Sensible global defaults for the storybook motion language
gsap.defaults({ ease: 'power2.out', duration: 0.9 })

export { gsap, ScrollTrigger }
