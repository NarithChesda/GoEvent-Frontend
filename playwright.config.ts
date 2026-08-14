import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for GoEvent.
 *
 * Tuned to be agent-friendly: headless by default, never spawns a blocking
 * report server, and always reuses an already-running dev server.
 * See docs/guides/PLAYWRIGHT.md before changing anything here.
 *
 * Browsers: Chromium only (desktop + mobile viewport). Firefox/WebKit are
 * deliberately not installed - adding them means `npx playwright install
 * firefox webkit` on every machine, and a broken/partial download there is
 * what silently breaks every subsequent run.
 */

const CI = !!process.env.CI
/** Opt into a visible browser window: `HEADED=1 npm run test:e2e` */
const HEADED = process.env.HEADED === '1' || process.env.HEADED === 'true'
const PORT = CI ? 4173 : 5173

export default defineConfig({
  testDir: './e2e',

  /* Per-test budget. The showcase pulls fonts, video and GSAP, so 30s is tight. */
  timeout: 45 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  /* Fail the build on CI if a test.only was left in the source. */
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,

  /*
   * `list` streams progress to stdout; the HTML report is written but never
   * served. Plain `reporter: 'html'` auto-opens a report web server on failure,
   * which hangs any non-interactive terminal until it is killed.
   */
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  outputDir: 'test-results/',

  use: {
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    baseURL: `http://localhost:${PORT}`,

    /* Diagnostics kept only for failures, so passing runs stay cheap. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Headless unless explicitly asked otherwise - agents have no display. */
    headless: !HEADED,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /* The showcase is mobile-first; this catches dvh/touch/safe-area regressions. */
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  /*
   * Dev server for local feedback, preview build on CI.
   * `reuseExistingServer` is on locally so a dev server you (or another agent)
   * already started is reused instead of racing for port 5173.
   */
  webServer: {
    command: CI ? 'npm run preview' : 'npm run dev',
    port: PORT,
    reuseExistingServer: !CI,
    /* Cold Vite start with this dependency tree can exceed the 60s default. */
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
