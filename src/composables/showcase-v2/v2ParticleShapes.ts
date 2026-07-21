/**
 * Built-in shapes for the V2 background particle layers (V2PetalField's CSS
 * fallback and V2Tunnel's WebGL sprites). Path/viewBox data is taken
 * verbatim from V1's particle shape registry
 * (`composables/showcase/useFallingParticles.ts`) so both showcase versions
 * render the exact same silhouettes — no backend or design work needed to
 * add a new one here later, just reuse V1's entry.
 */
export type V2ParticleShape = 'petals' | 'hearts' | 'leaves' | 'maple'

export interface V2ParticleShapeDef {
  path: string
  viewBox: string
}

export const V2_PARTICLE_SHAPES: Record<V2ParticleShape, V2ParticleShapeDef> = {
  petals: {
    path: 'M16 2C11 6 6 8 6 14c0 6 5 10 10 14 5-4 10-8 10-14 0-6-5-8-10-12z',
    viewBox: '0 0 32 32',
  },
  leaves: {
    path: 'M2 28C2 28 6 20 14 12c8-8 16-10 16-10S28 10 20 18C12 26 2 28 2 28zM14 12l6 6',
    viewBox: '0 0 32 32',
  },
  // Japanese maple (momiji): 7 slender pointed lobes with concave sides + stem
  maple: {
    path: 'M16 1Q17.2 7.8 17.7 10.7Q19.6 9.2 24.2 4.7Q21.4 10.5 20.5 12.7Q22.4 12.9 28.4 12Q23.1 14.8 21.6 16.1Q24.6 17.7 26.3 19.8Q20.3 19.4 17 18.8L16.4 25.5 15.6 25.5 15 18.8Q11.7 19.4 5.7 19.8Q7.4 17.7 10.4 16.1Q8.9 14.8 3.6 12Q9.6 12.9 11.5 12.7Q10.6 10.5 7.8 4.7Q12.4 9.2 14.3 10.7Q14.8 7.8 16 1z',
    viewBox: '0 0 32 32',
  },
  hearts: {
    path: 'M16 29C16 29 2 20.5 2 11.2 2 6.6 5.7 3 10.1 3c2.7 0 5.1 1.4 5.9 3.4C16.8 4.4 19.2 3 21.9 3 26.3 3 30 6.6 30 11.2 30 20.5 16 29 16 29z',
    viewBox: '0 0 32 32',
  },
}
