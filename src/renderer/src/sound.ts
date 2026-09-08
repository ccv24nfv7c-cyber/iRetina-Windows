/**
 * Tiny WebAudio chime generator for the break overlay.
 * Synthesised at runtime so the app ships with no audio assets.
 */

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!ctx) ctx = new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface ToneOptions {
  freq: number
  /** seconds from now */
  at?: number
  /** seconds */
  duration?: number
  gain?: number
  type?: OscillatorType
}

function tone({ freq, at = 0, duration = 0.6, gain = 0.14, type = 'sine' }: ToneOptions): void {
  const ac = audioCtx()
  if (!ac) return
  const t0 = ac.currentTime + at

  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)

  const amp = ac.createGain()
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Soft, low two-note swell — played as the break begins. */
export function playBreakStart(): void {
  tone({ freq: 329.63, duration: 0.55, gain: 0.09 }) // E4
  tone({ freq: 493.88, at: 0.14, duration: 0.7, gain: 0.07 }) // B4
}

/** Bright bell "ding" — played as the overlay fades away. */
export function playBreakEnd(): void {
  tone({ freq: 659.25, duration: 0.9, gain: 0.16 }) // E5
  tone({ freq: 987.77, at: 0.085, duration: 1.1, gain: 0.12 }) // B5
  tone({ freq: 1318.51, at: 0.17, duration: 1.3, gain: 0.06 }) // E6 shimmer
}
