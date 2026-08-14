# Playwright E2E Testing

Browsers are **already installed** on this machine. Just run `npm run test:e2e`.

---

## ⚠️ Never run `npx playwright install`

On this Windows setup that command **hangs**. It completes the ~149MB download, then
deadlocks before extracting — burning 0% CPU indefinitely. What it leaves behind is worse
than doing nothing:

- a partial `chromium-<rev>/chrome-win/` containing a **0-byte `chrome.dll`** and no `chrome.exe`
- a stale `__dirlock` in the ms-playwright root

Playwright validates an install by looking for an `INSTALLATION_COMPLETE` marker file in the
browser directory. The hung install never writes it, so every subsequent run sees a directory
that *exists but is incomplete*, demands a reinstall, and hangs again. That loop is why this
project appeared to need a reinstall on every session.

**If you genuinely need to (re)install browsers, use:**

```bash
npm run test:e2e:install
```

That runs [`scripts/install-playwright-browsers.ps1`](../../scripts/install-playwright-browsers.ps1),
which reads the required revisions from `playwright-core/browsers.json`, downloads each zip, and
extracts it with .NET's `ZipFile` (~3 seconds), then writes the `INSTALLATION_COMPLETE` marker.
It is idempotent — already-installed browsers are skipped. Pass `-Force` to reinstall anyway.

---

## Commands

| Command | What it does |
|---|---|
| `npm run test:e2e` | Full suite, both projects, headless |
| `npm run test:e2e:chromium` | Desktop Chrome viewport only |
| `npm run test:e2e:mobile` | Pixel 7 viewport only |
| `npm run test:e2e:headed` | Visible browser window (local debugging) |
| `npm run test:e2e:ui` | Playwright UI mode (interactive; do not use from an agent) |
| `npm run test:e2e:report` | Open the HTML report from the last run |
| `npm run test:e2e:install` | Install/repair browser binaries |

Useful flags: `--grep "pattern"`, `--project=chromium`, `-g "test name"`, `--debug`.

## What is installed

Chromium only, by deliberate choice — Firefox and WebKit are ~350MB more and a partial download
of either recreates the breakage above.

| Binary | Why |
|---|---|
| `chromium` | Headed runs |
| `chromium-headless-shell` | **Headless runs** — this is what `headless: true` actually launches; without it every headless run demands a reinstall |
| `ffmpeg` | Encodes the failure videos (`video: 'retain-on-failure'`) |
| `winldd` | Windows dependency validation |

To add WebKit later, add it to the `$targets` list in the install script and add a project to
`playwright.config.ts`.

## Config notes ([playwright.config.ts](../../playwright.config.ts))

Choices that exist specifically so agents and CI don't hang or flake:

- **`reporter: [['list'], ['html', { open: 'never' }]]`** — plain `reporter: 'html'` auto-opens a
  report **web server** on failure, which blocks a non-interactive terminal until killed.
  `open: 'never'` still writes the report; view it with `npm run test:e2e:report`.
- **`headless: !HEADED`** — headless by default; opt in with `HEADED=1`. Agents have no display.
- **`reuseExistingServer`** (local) — reuses a dev server already on :5173 instead of racing for
  the port. Playwright starts one only if none is running.
- **`webServer.timeout: 120s`** — a cold Vite dep-optimization pass on this dependency tree can
  exceed the 60s default and read as a mysterious startup failure.
- **`timeout: 45s`** — the showcase loads fonts, video and GSAP; 30s was tight.
- **`trace`/`screenshot`/`video`: on failure only** — full diagnostics when something breaks,
  no cost when it doesn't. Artifacts land in `test-results/`.

## Writing tests

Import from [`e2e/fixtures.ts`](../../e2e/fixtures.ts), not from `@playwright/test` directly:

```ts
import { test, expect, waitForAppMount } from './fixtures'

test('does the thing', async ({ page, consoleErrors, stubApi }) => {
  await stubApi(page)
  await page.goto('/signin')
  await waitForAppMount(page)

  await expect(page.getByRole('button', { name: 'Sign in with email' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})
```

- **`stubApi(page)`** answers the Django backend with an empty paginated body, so tests don't
  need a live API on `127.0.0.1:8000`. Register a more specific `page.route` *before* calling it
  when a test needs real payloads — Playwright matches the most recently added route first.
- **`consoleErrors`** collects console errors and uncaught exceptions, minus known environmental
  noise (favicons, Google Fonts, ResizeObserver loops).
- **`waitForAppMount(page)`** waits for the Vue app to actually render into `#app`. Prefer it over
  `waitUntil: 'networkidle'`, which is unreliable here because the showcase holds connections open.

### Two traps this project has already hit

1. **Never scope an API stub with a path glob like `**/api/**`.** Under Vite dev the app's own
   modules are served from paths containing an `api` segment (e.g.
   `/src/services/api/core/ApiClient.ts`), so that glob answers the app's *JavaScript* with JSON
   and the app never mounts — presenting as a blank page and a `waitForSelector` timeout. Scope
   stubs to the backend **origin**, as `stubApi` does.

2. **`/signin` leads with OAuth buttons.** The email/password fields are hidden until
   "Sign in with email" is clicked.

## Type checking

`e2e/tsconfig.json` is referenced from the root `tsconfig.json`, so `npm run type-check` covers
E2E tests too. Note that `src/` currently has pre-existing type errors unrelated to E2E.

## Artifacts

`test-results/` and `playwright-report/` are gitignored. Playwright also writes temp dirs to
`%TEMP%` (`playwright-artifacts-*`, `playwright-download-*`, `playwright_chromiumdev_profile-*`);
interrupted runs leave these behind and they accumulate — clearing them is safe when no run is
active.
