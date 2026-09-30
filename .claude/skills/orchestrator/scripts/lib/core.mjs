/**
 * Run state for the orchestrator skill: config, paths, the run.json store and
 * plan validation. No child processes here — see git.mjs and checks.mjs.
 *
 * One run = one feature. Its whole state lives in
 * `<runsDir>/<run-id>/run.json` and is written ONLY by orch.mjs (and the Stop
 * hook's stall counter). Agents never hand-edit it: every gate result is
 * something a script computed, which is what lets the hook trust it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export const STATUSES = [
  'planning',
  'awaiting-plan-approval',
  'building',
  'awaiting-final-review',
  'needs-human',
  'paused',
  'done',
  'aborted',
]
/** The only status the Stop hook enforces. Every other one is a legitimate place to stop. */
export const ENFORCED = new Set(['building'])
export const TERMINAL = new Set(['done', 'aborted'])

export function loadConfig() {
  const file = process.env.ORCH_CONFIG
    ? path.resolve(process.env.ORCH_CONFIG)
    : path.join(SKILL_DIR, 'config.json')
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export const toPosix = (p) => p.split(path.sep).join('/')

/** Repo-relative, forward-slash path — the one spelling every key in run.json uses. */
export function rel(root, p) {
  return toPosix(path.relative(root, path.resolve(root, p)))
}

export function runsDir(root, cfg) {
  return path.resolve(root, cfg.runsDir)
}

export function runDir(root, cfg, id) {
  return path.join(runsDir(root, cfg), id)
}

export function listRuns(root, cfg) {
  const dir = runsDir(root, cfg)
  if (!fs.existsSync(dir)) return []
  const runs = []
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, 'run.json')
    if (!fs.existsSync(file)) continue
    try {
      runs.push(JSON.parse(fs.readFileSync(file, 'utf8')))
    } catch {
      /* a half-written or hand-mangled run is skipped, never fatal */
    }
  }
  return runs.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
}

/**
 * The run a command acts on: `--run <id>` if given, else this session's live
 * run, else the only live run there is. Ambiguity is an error, not a guess.
 */
export function resolveRun(root, cfg, { runId, sessionId } = {}) {
  const runs = listRuns(root, cfg)
  if (runId) {
    const run = runs.find((r) => r.id === runId)
    if (!run) throw new Error(`No run "${runId}" in ${cfg.runsDir}`)
    return run
  }
  const live = runs.filter((r) => !TERMINAL.has(r.status))
  if (sessionId) {
    const mine = live.filter((r) => r.session_id === sessionId)
    if (mine.length) return mine[0]
  }
  if (live.length === 1) return live[0]
  if (!live.length)
    throw new Error('No live orchestrator run. Start one with `orch.mjs init "<title>"`.')
  throw new Error(
    `Several live runs (${live.map((r) => r.id).join(', ')}) and none bound to this session — pass --run <id>, or \`use <id>\` to bind one.`,
  )
}

export function saveRun(root, cfg, run, event, detail) {
  run.state_rev = (run.state_rev || 0) + 1
  run.updated_at = new Date().toISOString()
  if (event) {
    run.history = run.history || []
    run.history.push({ at: run.updated_at, event, ...(detail ? { detail } : {}) })
  }
  writeJsonAtomic(path.join(runDir(root, cfg, run.id), 'run.json'), run)
}

/** Hook-only write: its counters must not look like progress to its own stall check. */
export function saveRunQuietly(root, cfg, run) {
  writeJsonAtomic(path.join(runDir(root, cfg, run.id), 'run.json'), run)
}

export function writeJsonAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  fs.renameSync(tmp, file)
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function slugify(title) {
  return (
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'feature'
  )
}

/** Minimal glob: `**` spans directories, `*` stays inside one segment. */
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'
        i += glob[i + 2] === '/' ? 2 : 1
      } else {
        re += '[^/]*'
      }
    } else if ('\\^$+?.()|{}[]'.includes(c)) {
      re += '\\' + c
    } else {
      re += c
    }
  }
  return new RegExp(`^${re}$`)
}

export function matchesAny(file, globs) {
  return globs.some((g) => globToRegExp(g).test(file))
}

export const isTestFile = (cfg, file) => matchesAny(file, cfg.testFilePatterns)

// ---------------------------------------------------------------------------
// Plan validation
// ---------------------------------------------------------------------------

const CP_ID = /^cp-\d{2,3}$/
const SEVERITIES = ['blocker', 'major', 'minor']

/**
 * Validates a planner-authored plan. Returns { errors, warnings }; any error
 * refuses the import. Paths are checked for shape, not existence — tests are
 * written after the plan, by the builder.
 */
export function validatePlan(plan, { dir, cfg, existingIds = [], existedAtStart = () => false }) {
  const errors = []
  const warnings = []
  const err = (m) => errors.push(m)
  if (!plan || typeof plan !== 'object') return { errors: ['plan is not a JSON object'], warnings }
  if (!Array.isArray(plan.checkpoints) || !plan.checkpoints.length)
    err('`checkpoints` must be a non-empty array')
  const seen = new Set(existingIds)
  let lastComplexity = 0
  for (const [i, cp] of (plan.checkpoints || []).entries()) {
    const at = `checkpoints[${i}]${cp && cp.id ? ` (${cp.id})` : ''}`
    if (!cp || typeof cp !== 'object') {
      err(`${at} is not an object`)
      continue
    }
    if (!CP_ID.test(cp.id || '')) err(`${at}.id must look like "cp-01"`)
    else if (seen.has(cp.id)) err(`${at}.id is a duplicate`)
    for (const k of ['title', 'intent']) {
      if (typeof cp[k] !== 'string' || !cp[k].trim()) err(`${at}.${k} must be a non-empty string`)
    }
    if (
      !Array.isArray(cp.acceptance) ||
      !cp.acceptance.length ||
      cp.acceptance.some((a) => typeof a !== 'string')
    )
      err(`${at}.acceptance must be a non-empty array of strings`)
    for (const dep of cp.depends_on || []) {
      if (!seen.has(dep)) err(`${at}.depends_on "${dep}" must name an EARLIER checkpoint`)
    }
    const tests = cp.tests || {}
    const unit = tests.unit || []
    const e2e = tests.e2e || []
    if (!Array.isArray(unit) || !Array.isArray(e2e))
      err(`${at}.tests.unit and .tests.e2e must be arrays`)
    for (const f of unit) {
      if (!matchesAny(f, cfg.unitTestPatterns))
        err(`${at}.tests.unit "${f}" does not match ${cfg.unitTestPatterns.join(', ')}`)
    }
    for (const f of e2e) {
      if (!matchesAny(f, cfg.e2eTestPatterns))
        err(`${at}.tests.e2e "${f}" does not match ${cfg.e2eTestPatterns.join(', ')}`)
      // E2E has no per-test baseline (the suite is too slow and too flaky to
      // capture at init), so its gates judge a spec FILE by exit code. A spec
      // that already fails would pass `gate red` for the wrong reason and keep
      // `gate behavior` red for good — smoke, partner-apply and expense-tab all
      // carry known failures or flakes. New behavior gets a new spec file.
      else if (existedAtStart(f))
        err(
          `${at}.tests.e2e "${f}" already existed when the run started — put this checkpoint's e2e tests in a new spec file (e.g. e2e/<feature>.spec.ts); the e2e gates judge whole files and an existing spec may already fail`,
        )
    }
    const exempt = cp.tdd_exempt
    if (exempt != null && (typeof exempt !== 'string' || exempt.trim().length < 12))
      err(`${at}.tdd_exempt must be null or a real reason (a sentence, not a word)`)
    if (exempt == null && unit.length + e2e.length === 0)
      err(`${at} has no planned tests — plan the tests that prove it, or give tdd_exempt a reason`)
    if (cp.ui != null) {
      const ui = cp.ui
      if (typeof ui.prototype !== 'string')
        err(`${at}.ui.prototype must be a path relative to the run dir`)
      else if (!fs.existsSync(path.resolve(dir, ui.prototype)))
        err(`${at}.ui.prototype "${ui.prototype}" does not exist in the run dir`)
      if (!Array.isArray(ui.screens) || !ui.screens.length)
        err(`${at}.ui.screens must list the states the e2e tests end on`)
      if (!e2e.length)
        err(
          `${at} has a ui block but no tests.e2e — the UI gate screenshots the e2e tests' final states`,
        )
    }
    if (cp.complexity != null) {
      if (!Number.isInteger(cp.complexity) || cp.complexity < 1 || cp.complexity > 5)
        err(`${at}.complexity must be 1–5`)
      else if (cp.complexity < lastComplexity)
        warnings.push(
          `${at} is simpler (${cp.complexity}) than the one before it — fine if a dependency forces the order`,
        )
      else lastComplexity = cp.complexity
    }
    if (cp.files != null && !Array.isArray(cp.files)) err(`${at}.files must be an array`)
    if (cp.id) seen.add(cp.id)
  }
  for (const [i, l] of (plan.learnings || []).entries()) {
    if (!l || typeof l.rule !== 'string' || typeof l.why !== 'string')
      err(`learnings[${i}] needs a "rule" and a "why"`)
  }
  return { errors, warnings }
}

/** Shape check for a reviewer's verdict file. */
export function validateVerdict(v, kind) {
  const errors = []
  const allowed = kind === 'adversary' ? ['approve', 'reject'] : ['pass', 'fail']
  if (!v || typeof v !== 'object') return ['verdict is not a JSON object']
  if (!allowed.includes(v.verdict)) errors.push(`verdict must be one of ${allowed.join('|')}`)
  if (typeof v.reviewed_tree !== 'string' || !/^[0-9a-f]{40,64}$/.test(v.reviewed_tree))
    errors.push('reviewed_tree must be the tree id you were given')
  if (!Array.isArray(v.findings))
    errors.push('findings must be an array (empty when there are none)')
  for (const [i, f] of (v.findings || []).entries()) {
    if (!SEVERITIES.includes(f && f.severity))
      errors.push(`findings[${i}].severity must be ${SEVERITIES.join('|')}`)
  }
  return errors
}

export const isBlocking = (f) => f.severity === 'blocker' || f.severity === 'major'
