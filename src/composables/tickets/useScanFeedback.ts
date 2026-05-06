/**
 * useScanFeedback
 *
 * Door-scanner UX feedback — synthesized beeps + haptic vibration. Both
 * channels are independently toggleable and the toggles persist in
 * localStorage (per-device, not per-user, since the same staff phone is
 * often shared across shifts).
 *
 * Sound uses the Web Audio API directly so we don't ship audio assets and
 * can hit different frequencies per outcome without latency. The
 * AudioContext is created lazily on the first user gesture-triggered scan to
 * comply with browser autoplay policies.
 */

import { ref, watch } from 'vue'

export type FeedbackKind = 'entry' | 'reentry' | 'rejected' | 'invalid'

const STORAGE_KEY_SOUND = 'scan:feedback:sound'
const STORAGE_KEY_HAPTIC = 'scan:feedback:haptic'

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === 'true'
  } catch {
    return fallback
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // localStorage may be unavailable (private browsing, quota) — ignore.
  }
}

interface BeepConfig {
  /** Frequencies in Hz, played sequentially. */
  notes: number[]
  /** Duration of each note in ms. */
  noteMs: number
  /** Gap between notes in ms. */
  gapMs: number
}

const BEEPS: Record<FeedbackKind, BeepConfig> = {
  entry: { notes: [880, 1320], noteMs: 80, gapMs: 30 },
  reentry: { notes: [660, 660], noteMs: 100, gapMs: 60 },
  rejected: { notes: [220, 200, 180], noteMs: 90, gapMs: 30 },
  invalid: { notes: [200], noteMs: 200, gapMs: 0 },
}

const VIBRATIONS: Record<FeedbackKind, number | number[]> = {
  entry: 100,
  reentry: [60, 40, 60],
  rejected: [50, 50, 50, 50, 50],
  invalid: 200,
}

export function useScanFeedback() {
  const soundEnabled = ref(readBool(STORAGE_KEY_SOUND, true))
  const hapticEnabled = ref(readBool(STORAGE_KEY_HAPTIC, true))

  watch(soundEnabled, (v) => writeBool(STORAGE_KEY_SOUND, v))
  watch(hapticEnabled, (v) => writeBool(STORAGE_KEY_HAPTIC, v))

  let audioCtx: AudioContext | null = null

  function ensureContext(): AudioContext | null {
    if (audioCtx) return audioCtx
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
      return audioCtx
    } catch {
      return null
    }
  }

  function beep(kind: FeedbackKind): void {
    if (!soundEnabled.value) return
    const ctx = ensureContext()
    if (!ctx) return

    // Some browsers (Safari) start the context in 'suspended'. Resume on the
    // first beep call which is always inside a user-gesture-driven scan event.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }

    const cfg = BEEPS[kind]
    let cursor = ctx.currentTime
    for (const freq of cfg.notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, cursor)
      gain.gain.linearRampToValueAtTime(0.18, cursor + 0.01)
      gain.gain.linearRampToValueAtTime(0, cursor + cfg.noteMs / 1000)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(cursor)
      osc.stop(cursor + cfg.noteMs / 1000 + 0.02)
      cursor += (cfg.noteMs + cfg.gapMs) / 1000
    }
  }

  function vibrate(kind: FeedbackKind): void {
    if (!hapticEnabled.value) return
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    try {
      navigator.vibrate(VIBRATIONS[kind])
    } catch {
      // Some browsers throw if the page isn't focused — safe to ignore.
    }
  }

  function trigger(kind: FeedbackKind): void {
    beep(kind)
    vibrate(kind)
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
  }

  function toggleHaptic() {
    hapticEnabled.value = !hapticEnabled.value
  }

  return {
    soundEnabled,
    hapticEnabled,
    toggleSound,
    toggleHaptic,
    trigger,
  }
}
