/**
 * Running the repo's own checks and judging them against a baseline.
 *
 * This repo is not clean: `vue-tsc --build` reports ~36 errors, ESLint ~107
 * and one unit test fails, all pre-existing. So no gate asks for zero — each
 * asks for "nothing NEW since the run started". Baselines are taken once, at
 * `init`, and every key deliberately leaves out line numbers so an edit above
 * an old error does not make it look new.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { rel } from './core.mjs'

const quote = (s) => `"${String(s).replace(/"/g, '\\"')}"`

export function renderCommand(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key]
    if (v === undefined) throw new Error(`Command template "${template}" needs {${key}}`)
    return Array.isArray(v) ? v.map(quote).join(' ') : quote(v)
  })
}

function killTree(child) {
  if (process.platform === 'win32') {
    // Killing the shell leaves npx's children running; take the whole tree.
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill('SIGKILL')
  }
}

/** Runs a shell command, streaming stdout+stderr into `logFile`. Never rejects. */
export function runCommand(command, { cwd, logFile, env = {}, timeoutMs = 15 * 60 * 1000 }) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  const log = fs.createWriteStream(logFile)
  log.write(`$ ${command}\n\n`)
  const started = Date.now()
  return new Promise((resolve) => {
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, ...env } })
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      killTree(child)
    }, timeoutMs)
    child.stdout.pipe(log, { end: false })
    child.stderr.pipe(log, { end: false })
    const done = (code, error) => {
      clearTimeout(timer)
      const result = { code, timedOut, durationMs: Date.now() - started, logFile, command }
      log.end(
        `\n[exit ${code}${timedOut ? ' — TIMED OUT' : ''}${error ? ` — ${error}` : ''} after ${Math.round(result.durationMs / 1000)}s]\n`,
        () => resolve(result),
      )
    }
    child.on('error', (e) => done(null, e.message))
    child.on('close', (code) => done(code))
  })
}

export function tail(file, lines = 25) {
  if (!fs.existsSync(file)) return ''
  return fs.readFileSync(file, 'utf8').trimEnd().split('\n').slice(-lines).join('\n')
}

// --- vue-tsc ---------------------------------------------------------------

/** `src/x.vue(12,5): error TS2322: msg` → multiset keyed by file|code|msg. */
export function parseTsc(text, root) {
  const counts = {}
  for (const line of text.split(/\r?\n/)) {
    let m = line.match(/^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/)
    let key
    if (m) key = `${rel(root, m[1].trim())}|${m[2]}|${m[3].trim()}`
    else if ((m = line.match(/^error (TS\d+): (.*)$/))) key = `-|${m[1]}|${m[2].trim()}`
    if (key) counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export function newCounts(current, baseline = {}) {
  const added = []
  for (const [key, n] of Object.entries(current)) {
    const extra = n - (baseline[key] || 0)
    if (extra > 0) added.push(extra > 1 ? `${key} (×${extra})` : key)
  }
  return added
}

// --- ESLint ----------------------------------------------------------------

/** ESLint JSON → { file: { "rule|message": count } }, errors only. */
export function parseEslint(file, root) {
  if (!fs.existsSync(file)) return null
  let results
  try {
    results = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
  const byFile = {}
  for (const r of results) {
    const counts = {}
    for (const m of r.messages || []) {
      if (m.severity !== 2) continue
      const key = `${m.ruleId || 'parse'}|${m.message}`
      counts[key] = (counts[key] || 0) + 1
    }
    byFile[rel(root, r.filePath)] = counts
  }
  return byFile
}

export function newLintErrors(current, baseline = {}) {
  const added = []
  for (const [file, counts] of Object.entries(current)) {
    for (const key of newCounts(counts, baseline[file] || {})) added.push(`${file}: ${key}`)
  }
  return added
}

// --- Vitest ----------------------------------------------------------------

/**
 * Vitest's JSON report → failing keys plus a per-file tally. A file that fails
 * to load (e.g. it imports a module that doesn't exist yet — the usual red
 * state) has no assertions and gets a single `file::<load>` key.
 */
export function parseVitest(file, root) {
  if (!fs.existsSync(file)) return null
  let report
  try {
    report = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
  const failing = []
  const byFile = {}
  for (const t of report.testResults || []) {
    const f = rel(root, t.name)
    const tally = { passed: 0, failed: 0, total: 0, loadError: false }
    for (const a of t.assertionResults || []) {
      tally.total++
      if (a.status === 'passed') tally.passed++
      else if (a.status === 'failed') {
        tally.failed++
        failing.push(`${f}::${a.fullName}`)
      }
    }
    if (t.status === 'failed' && tally.failed === 0) {
      tally.loadError = true
      failing.push(`${f}::<load>`)
    }
    byFile[f] = tally
  }
  return { failing, byFile }
}

// --- Baselines -------------------------------------------------------------

export async function captureBaselines({ root, cfg, dir }) {
  const out = path.join(dir, 'baseline')
  fs.mkdirSync(out, { recursive: true })
  const jobs = []
  const baseline = {
    captured_at: new Date().toISOString(),
    typecheck: null,
    lint: null,
    unit: null,
    problems: [],
  }

  if (cfg.commands.lint) {
    const json = path.join(out, 'lint.json')
    const cmd = renderCommand(cfg.commands.lint, { files: cfg.lintRoots, out: json })
    jobs.push(
      runCommand(cmd, { cwd: root, logFile: path.join(out, 'lint.log') }).then(() => {
        baseline.lint = parseEslint(json, root)
        if (!baseline.lint)
          baseline.problems.push('lint produced no JSON report — see baseline/lint.log')
      }),
    )
  }
  if (cfg.commands.unit) {
    const json = path.join(out, 'unit.json')
    const cmd = renderCommand(cfg.commands.unit, { files: cfg.unitRoots, out: json })
    jobs.push(
      runCommand(cmd, { cwd: root, logFile: path.join(out, 'unit.log') }).then(() => {
        const parsed = parseVitest(json, root)
        baseline.unit = parsed ? parsed.failing : null
        if (!parsed)
          baseline.problems.push('unit suite produced no JSON report — see baseline/unit.log')
      }),
    )
  }
  await Promise.all(jobs)
  // After the unit suite, not beside it: a flake captured here would be
  // excused as "pre-existing" for the whole run.
  if (cfg.commands.typecheck) {
    const r = await runCommand(cfg.commands.typecheck, {
      cwd: root,
      logFile: path.join(out, 'typecheck.log'),
    })
    baseline.typecheck = parseTsc(fs.readFileSync(r.logFile, 'utf8'), root)
  }
  return baseline
}
