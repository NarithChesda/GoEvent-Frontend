/**
 * Screenshots a checkpoint's HTML prototype with the repo's own Playwright, in
 * the same two devices the e2e projects use (playwright.config.ts), so the UI
 * reviewer compares like with like.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function shootPrototype({ root, htmlFile, outDir, viewports }) {
  const require = createRequire(path.join(root, 'package.json'))
  const { chromium, devices } = require('@playwright/test')
  const browser = await chromium.launch()
  const shots = []
  try {
    for (const [name, vp] of Object.entries(viewports)) {
      const context = await browser.newContext(
        vp.device ? devices[vp.device] : { viewport: vp.viewport },
      )
      const page = await context.newPage()
      await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts && document.fonts.ready)
      const file = path.join(outDir, `prototype-${name}.png`)
      await page.screenshot({ path: file, fullPage: true })
      shots.push(file)
      await context.close()
    }
  } finally {
    await browser.close()
  }
  return shots
}
