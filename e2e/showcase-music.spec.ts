import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * When the showcase's background music starts (`music_start_stage`).
 *
 * `transition` starts it on the envelope tap, because that is when the
 * transition starts: the animated stage mounts and begins moving while the
 * cover is still leaving, and a transition film starts playing. It used to wait
 * ~1.4s for the cover to clear, so the opening animation played in silence —
 * and on a film template the cue was never sent at all, so the music waited for
 * the whole film to end.
 *
 * The media is generated rather than checked in. A WAV plays, fires
 * `canplaythrough` (which is what unlocks the envelope on a film template) and
 * ends in a <video> just as a real film does, and timing is all this checks.
 */

const API_ORIGIN = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
/** Its own origin, so nothing here competes with the catch-all API stub. */
const MEDIA_ORIGIN = 'https://media.e2e.test'
const EVENT_ID = 'e-showcase-music'
const FILM_SECONDS = 4
/** "On the tap": the cue runs inside the tap's own handler, so allow only slack. */
const ON_THE_TAP_MS = 500

/** Seconds of a quiet sine, as 8 kHz mono 16-bit PCM. */
function toneWav(seconds: number, hz: number): Buffer {
  const rate = 8000
  const samples = Math.round(rate * seconds)
  const wav = Buffer.alloc(44 + samples * 2)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + samples * 2, 4)
  wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16) // fmt chunk size
  wav.writeUInt16LE(1, 20) // PCM
  wav.writeUInt16LE(1, 22) // mono
  wav.writeUInt32LE(rate, 24)
  wav.writeUInt32LE(rate * 2, 28) // byte rate
  wav.writeUInt16LE(2, 32) // block align
  wav.writeUInt16LE(16, 34) // bits per sample
  wav.write('data', 36)
  wav.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++) {
    wav.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * 3000), 44 + i * 2)
  }
  return wav
}

const FILM = toneWav(FILM_SECONDS, 440)
const MUSIC = toneWav(30, 330)
const PHOTO =
  '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="160"><rect width="90" height="160" fill="#c9a227"/></svg>'

/** When the envelope was tapped, the music first asked to play, and the film ended. */
interface MediaProbe {
  tapAt: number | null
  musicPlayAt: number | null
  filmEndedAt: number | null
}

type MusicStartStage = 'transition' | 'main_content' | null

async function openShowcase(
  page: Page,
  { transition, musicStartStage }: { transition: 'video' | 'animation'; musicStartStage: MusicStartStage },
) {
  const isFilm = transition === 'video'
  const event = {
    id: EVENT_ID,
    title: 'Showcase music',
    start_date: '2031-06-01T03:00:00Z',
    end_date: '2031-06-01T09:00:00Z',
    timezone: 'Asia/Phnom_Penh',
    event_texts: [],
    hosts: [],
    // The animated beat is drawn over the featured photo; without one it is skipped.
    photos: isFilm ? [] : [{ id: 1, image: `${MEDIA_ORIGIN}/featured.svg`, is_featured: true, order: 0 }],
    agenda_items: [],
    payment_methods: [],
    dress_codes: [],
    music: `${MEDIA_ORIGIN}/music.wav`,
    music_start_stage: musicStartStage,
    event_video: isFilm ? `${MEDIA_ORIGIN}/film.wav` : null,
    template_assets: {
      // Pinned: the local .env sends wedding-like events to the V2 scroll story.
      showcase_template_version: 'v1',
      stage_modes: { cover: 'animation', transition, background: 'animation' },
      assets: {},
      cover_stage_layout: { showcaseAnimationType: 'decoration' },
    },
  }

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === `/api/events/${EVENT_ID}/showcase/`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event,
          meta: { language: 'en', available_languages: [{ code: 'en', display: 'English' }] },
        }),
      }),
  )
  await page.route(`${MEDIA_ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname
    // The film is fetched into a blob before it plays, so it needs CORS.
    const headers = { 'Access-Control-Allow-Origin': '*' }
    if (path === '/featured.svg') {
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: PHOTO })
    }
    return route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      headers,
      body: path === '/film.wav' ? FILM : MUSIC,
    })
  })

  await page.addInitScript(() => {
    const probe: MediaProbe = { tapAt: null, musicPlayAt: null, filmEndedAt: null }
    ;(window as unknown as { __mediaProbe: MediaProbe }).__mediaProbe = probe

    for (const type of ['click', 'touchend']) {
      window.addEventListener(type, () => (probe.tapAt ??= performance.now()), true)
    }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this instanceof HTMLAudioElement) probe.musicPlayAt ??= performance.now()
      return play.call(this)
    }
    document.addEventListener(
      'ended',
      (e) => {
        if (e.target instanceof HTMLVideoElement) probe.filmEndedAt ??= performance.now()
      },
      true,
    )
  })

  await page.goto(`/events/${EVENT_ID}/showcase?lang=en`)
}

/**
 * Opens the envelope. The whole cover is the tap target, and its pointer
 * cursor is what says it can be opened — on a film template, only once the
 * film can play.
 */
async function tapCover(page: Page, hasTouch: boolean) {
  const cover = page.locator('.cover-copy-exit.cursor-pointer')
  await expect(cover).toBeVisible({ timeout: 20_000 })
  if (hasTouch) await cover.tap()
  else await cover.click()
}

const readProbe = (page: Page) =>
  page.evaluate(() => (window as unknown as { __mediaProbe: MediaProbe }).__mediaProbe)

async function probeAfterFilm(page: Page): Promise<MediaProbe> {
  await expect
    .poll(async () => (await readProbe(page)).filmEndedAt, { timeout: (FILM_SECONDS + 10) * 1000 })
    .not.toBeNull()
  return readProbe(page)
}

test.describe('showcase music start', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('set to the transition, it starts on the tap, under the animated transition', async ({
    page,
    hasTouch,
  }) => {
    await openShowcase(page, { transition: 'animation', musicStartStage: 'transition' })
    await tapCover(page, hasTouch)

    await expect.poll(async () => (await readProbe(page)).musicPlayAt).not.toBeNull()
    const { tapAt, musicPlayAt } = await readProbe(page)

    expect(musicPlayAt! - tapAt!).toBeLessThan(ON_THE_TAP_MS)
    await expect(page.locator('.transition-stage')).toBeVisible()
  })

  test('set to the transition, it starts on the tap, under the transition film', async ({
    page,
    hasTouch,
  }) => {
    await openShowcase(page, { transition: 'video', musicStartStage: 'transition' })
    await tapCover(page, hasTouch)

    const { tapAt, musicPlayAt } = await probeAfterFilm(page)

    expect(musicPlayAt, 'the music never started').not.toBeNull()
    expect(musicPlayAt! - tapAt!).toBeLessThan(ON_THE_TAP_MS)
  })

  test('set to the invitation, it still waits for the film to end', async ({ page, hasTouch }) => {
    await openShowcase(page, { transition: 'video', musicStartStage: 'main_content' })
    await tapCover(page, hasTouch)

    const { musicPlayAt, filmEndedAt } = await probeAfterFilm(page)

    expect(musicPlayAt, 'the music never started').not.toBeNull()
    expect(musicPlayAt!).toBeGreaterThanOrEqual(filmEndedAt!)
  })

  test('left on the default, a film template starts it on the tap, as it always has', async ({
    page,
    hasTouch,
  }) => {
    await openShowcase(page, { transition: 'video', musicStartStage: null })
    await tapCover(page, hasTouch)

    const { tapAt, musicPlayAt } = await probeAfterFilm(page)

    expect(musicPlayAt, 'the music never started').not.toBeNull()
    expect(musicPlayAt! - tapAt!).toBeLessThan(ON_THE_TAP_MS)
  })
})
