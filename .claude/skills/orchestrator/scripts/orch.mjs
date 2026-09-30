#!/usr/bin/env node
/**
 * orch.mjs — the orchestrator skill's state machine and gate runner.
 *
 *   node .claude/skills/orchestrator/scripts/orch.mjs <command> [args] [--run <id>]
 *
 * `help` lists the commands. Every gate result this writes is stamped with
 * the working tree it ran against (see lib/git.mjs); the Stop hook reads the
 * same run.json and refuses to let the session end while a run is building
 * and its gates are not clear at the current tree.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  TERMINAL,
  isBlocking,
  isTestFile,
  listRuns,
  loadConfig,
  matchesAny,
  readJson,
  rel,
  resolveRun,
  runDir,
  saveRun,
  slugify,
  validatePlan,
  validateVerdict,
} from './lib/core.mjs'
import {
  changedFiles,
  diffPatch,
  diffStat,
  fileHash,
  repoRoot,
  snapshotTree,
  treeHasFile,
} from './lib/git.mjs'
import {
  captureBaselines,
  newCounts,
  newLintErrors,
  parseEslint,
  parseTsc,
  parseVitest,
  renderCommand,
  runCommand,
} from './lib/checks.mjs'
import { ORCH, checkpointProgress, runProgress } from './lib/evaluate.mjs'
import { planFieldsOf, writeBrief } from './lib/briefs.mjs'

const USAGE = `orchestrator CLI — ${ORCH} <command> [args] [--run <id>]

Run lifecycle
  init "<title>"                 new run for this session; captures baselines (~1 min)
  use <run-id>                   bind an existing run to this session (resume after a restart)
  list                           all runs
  status [--json]                where the run is and the one next step
  plan <file> [--check|--append|--replace-pending]
                                 validate / import the planner's plan; --append adds a feedback
                                 round's checkpoints; --replace-pending swaps the not-yet-started
                                 ones mid-build (back to the human for approval)
  approve [--note "<words>"]     the human approved the plan → building
  review-ready                   final gate clear → hand to the human
  feedback <notes.md>            the human's review notes → back to planning
  done [--note "<words>"]        the human accepted the result
  escalate "<reason>"            stop and ask the human (legitimate stop)
  pause "<reason>" | resume      the human asked to pause / answered
  abort "<reason>"               give up on the run

Per checkpoint
  start <cp>                     begin the next checkpoint (records its start tree)
  gate red <cp>                  planned tests exist and FAIL, and nothing but tests changed yet
  gate behavior <cp>             unit suite, planned e2e, type-check, lint — nothing new broken
  gate ui <cp>                   e2e screenshots + prototype shots + detector → evidence manifest
  record ui <cp> <verdict.json>  store the UI reviewer's verdict
  record adversary <cp> <v.json> store an adversary round
  complete <cp>                  all gates clear at the current tree → passed
  gate final                     after the last checkpoint: everything, at the final tree

Helpers
  brief <role> [cp]              write a sub-agent's brief; roles: planner builder ui-reviewer adversary fixer
  diff [cp]                      write the run's (or checkpoint's) diff to a file and print the stat
  tree                           print the current working-tree fingerprint`

class Refusal extends Error {}
const refuse = (msg) => {
  throw new Refusal(msg)
}
const say = (...a) => console.log(...a)
const short = (t) => String(t || '').slice(0, 8)
const now = () => new Date().toISOString()

function parseArgs(argv) {
  const pos = []
  const flags = {}
  const valued = new Set(['run', 'note', 'session'])
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      if (valued.has(key)) flags[key] = argv[++i]
      else flags[key] = true
    } else pos.push(a)
  }
  return { pos, flags }
}

const { pos, flags } = parseArgs(process.argv.slice(2))
const command = pos.shift()
const root = repoRoot()
const cfg = loadConfig()
const sessionId = flags.session || process.env.CLAUDE_CODE_SESSION_ID || null

/** Run lookup problems (none live, several, unknown id) are refusals, not crashes. */
function findRun(opts) {
  try {
    return resolveRun(root, cfg, opts)
  } catch (e) {
    return refuse(e.message)
  }
}

function ctx() {
  const run = findRun({ runId: flags.run, sessionId })
  return { run, dir: runDir(root, cfg, run.id) }
}
const save = (run, event, detail) => saveRun(root, cfg, run, event, detail)

function requireStatus(run, ...statuses) {
  if (!statuses.includes(run.status))
    refuse(`Run ${run.id} is "${run.status}"; this needs ${statuses.join(' or ')}.`)
}

function findCp(run, id) {
  const cp = run.checkpoints.find((c) => c.id === id)
  if (!cp)
    refuse(
      `No checkpoint "${id}". Checkpoints: ${run.checkpoints.map((c) => c.id).join(', ') || 'none yet'}.`,
    )
  cp.gates = cp.gates || {}
  return cp
}

function requireActive(run, cp) {
  requireStatus(run, 'building')
  const current = run.checkpoints.find((c) => c.status !== 'passed')
  if (cp.status === 'passed') refuse(`${cp.id} has already passed.`)
  if (current !== cp) refuse(`${current.id} is the current checkpoint; ${cp.id} comes after it.`)
  if (cp.status !== 'in-progress') refuse(`${cp.id} has not been started — \`start ${cp.id}\`.`)
}

const evDir = (dir, cp) => path.join(dir, 'evidence', cp ? cp.id : 'final')

// ---------------------------------------------------------------------------
// Checks. Each returns { name, ok, summary, log, details? } or null (not configured).
// ---------------------------------------------------------------------------

async function unitCheck({ run, ev, tag, files, planned = [], mode, tree }) {
  if (!cfg.commands.unit) return null
  const json = path.join(ev, `${tag}-unit.json`)
  fs.rmSync(json, { force: true })
  const res = await runCommand(renderCommand(cfg.commands.unit, { files, out: json }), {
    cwd: root,
    logFile: path.join(ev, `${tag}-unit.log`),
    timeoutMs: cfg.timeouts.unit * 1000,
  })
  const log = rel(root, res.logFile)
  const parsed = parseVitest(json, root)
  if (!parsed)
    return {
      name: 'unit',
      ok: false,
      summary: `no JSON report${res.timedOut ? ' (timed out)' : ''} — vitest crashed or never ran`,
      log,
    }
  const base = new Set(run.baseline.unit || [])
  const details = []
  let ok = true
  if (mode === 'red') {
    for (const f of planned) {
      const t = parsed.byFile[f]
      const failing = parsed.failing.filter((k) => k.startsWith(`${f}::`) && !base.has(k))
      if (!t) {
        ok = false
        details.push(`${f}: not collected by vitest`)
      } else if (!failing.length) {
        ok = false
        details.push(`${f}: nothing fails — a red test must fail before the code exists`)
      } else
        details.push(
          `${f}: ${failing.length} failing${t.loadError ? ' (the module does not load yet)' : ''}`,
        )
    }
    return {
      name: 'unit',
      ok,
      summary: ok
        ? 'planned specs fail, as they should before the code exists'
        : 'planned specs are not red',
      log,
      details,
    }
  }
  let added = parsed.failing.filter((k) => !base.has(k))
  // Timing-sensitive specs fail now and then on a loaded machine (ListingFormDrawer
  // did, in the first real run). A new failure only counts against this run if it
  // reproduces alone, or if its spec is one this run touched: a spec the run never
  // edited that fails in the suite and passes by itself is a flake, reported not
  // charged — a gate that fails on flakes teaches everyone to ignore it.
  const touched = new Set(changedFiles(root, run.start_tree, tree).map((c) => c.file))
  const suspects = [...new Set(added.map((k) => k.slice(0, k.indexOf('::'))))].filter(
    (f) => !touched.has(f) && !planned.includes(f),
  )
  if (suspects.length) {
    const alone = path.join(ev, `${tag}-unit-alone.json`)
    fs.rmSync(alone, { force: true })
    await runCommand(renderCommand(cfg.commands.unit, { files: suspects, out: alone }), {
      cwd: root,
      logFile: path.join(ev, `${tag}-unit-alone.log`),
      timeoutMs: cfg.timeouts.unit * 1000,
    })
    const again = parseVitest(alone, root)
    if (again) {
      const still = new Set(again.failing)
      const flaky = added.filter(
        (k) => suspects.includes(k.slice(0, k.indexOf('::'))) && !still.has(k),
      )
      added = added.filter((k) => !flaky.includes(k))
      for (const k of flaky)
        details.push(
          `flaky, not counted: ${k} — failed in the suite, passes alone, and this run never touched its spec`,
        )
    }
  }
  for (const k of added) details.push(`new failure: ${k}`)
  if (added.length) ok = false
  for (const f of planned) {
    const t = parsed.byFile[f]
    if (!t) {
      ok = false
      details.push(`${f}: not collected by vitest`)
    } else if (!t.passed) {
      ok = false
      details.push(`${f}: no passing tests`)
    }
  }
  const total = Object.values(parsed.byFile).reduce((a, t) => a + t.total, 0)
  return {
    name: 'unit',
    ok,
    summary: ok ? `${total} tests, no new failures` : `${added.length} new failure(s)`,
    log,
    details,
  }
}

async function e2eCheck({ ev, tag, files, expect, env, outDir }) {
  if (!files.length || !cfg.commands.e2e) return null
  const out = outDir || path.join(ev, `${tag}-e2e-results`)
  const res = await runCommand(renderCommand(cfg.commands.e2e, { files, out }), {
    cwd: root,
    logFile: path.join(ev, `${tag}-e2e.log`),
    env,
    timeoutMs: cfg.timeouts.e2e * 1000,
  })
  const log = rel(root, res.logFile)
  if (res.timedOut) return { name: 'e2e', ok: false, summary: 'timed out', log }
  if (expect === 'fail') {
    return res.code !== 0
      ? {
          name: 'e2e',
          ok: true,
          summary: 'planned specs fail — confirm in the log they fail on assertions, not on setup',
          log,
        }
      : {
          name: 'e2e',
          ok: false,
          summary:
            'planned e2e specs PASS before the code exists — they do not test the new behavior',
          log,
        }
  }
  return {
    name: 'e2e',
    ok: res.code === 0,
    summary: res.code === 0 ? `${files.length} spec file(s) pass` : `failed (exit ${res.code})`,
    log,
  }
}

async function typecheckCheck({ run, ev, tag }) {
  if (!cfg.commands.typecheck) return null
  const res = await runCommand(cfg.commands.typecheck, {
    cwd: root,
    logFile: path.join(ev, `${tag}-typecheck.log`),
    timeoutMs: cfg.timeouts.typecheck * 1000,
  })
  const log = rel(root, res.logFile)
  const current = parseTsc(fs.readFileSync(res.logFile, 'utf8'), root)
  if (res.timedOut) return { name: 'typecheck', ok: false, summary: 'timed out', log }
  if (res.code !== 0 && !Object.keys(current).length)
    return {
      name: 'typecheck',
      ok: false,
      summary: `exited ${res.code} without reporting a single error — read the log`,
      log,
    }
  const added = newCounts(current, run.baseline.typecheck || {})
  return {
    name: 'typecheck',
    ok: !added.length,
    summary: added.length ? `${added.length} new error(s)` : 'no new errors',
    log,
    details: added.slice(0, 25),
  }
}

async function lintCheck({ run, ev, tag, tree }) {
  if (!cfg.commands.lint) return null
  const files = changedFiles(root, run.start_tree, tree)
    .filter((c) => c.status !== 'D')
    .map((c) => c.file)
    .filter((f) => cfg.lintExtensions.includes(path.extname(f)) && matchesAny(f, cfg.lintScope))
  if (!files.length)
    return { name: 'lint', ok: true, summary: 'no lintable file changed', log: null }
  const json = path.join(ev, `${tag}-lint.json`)
  fs.rmSync(json, { force: true })
  const res = await runCommand(renderCommand(cfg.commands.lint, { files, out: json }), {
    cwd: root,
    logFile: path.join(ev, `${tag}-lint.log`),
    timeoutMs: cfg.timeouts.lint * 1000,
  })
  const log = rel(root, res.logFile)
  const current = parseEslint(json, root)
  if (!current)
    return {
      name: 'lint',
      ok: false,
      summary: 'no JSON report — ESLint crashed; read the log',
      log,
    }
  const added = newLintErrors(current, run.baseline.lint || {})
  return {
    name: 'lint',
    ok: !added.length,
    summary: added.length
      ? `${added.length} new error(s) in ${files.length} changed file(s)`
      : `${files.length} changed file(s), no new errors`,
    log,
    details: added.slice(0, 25),
  }
}

/** Stamps a gate with its tree — and voids it if the tree moved while it ran. */
function seal(checks, tree) {
  const list = checks.filter(Boolean)
  if (snapshotTree(root) !== tree) {
    list.push({
      name: 'tree',
      ok: false,
      summary: 'the working tree changed while the gate ran — re-run it on a still tree',
      log: null,
    })
  }
  return { ok: list.every((c) => c.ok), tree, at: now(), checks: list }
}

function printGate(label, result) {
  say(`${label} @ ${short(result.tree)} — ${result.ok ? 'PASSED' : 'FAILED'}`)
  for (const c of result.checks) {
    say(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(10)} ${c.summary}`)
    for (const d of c.details || []) say(`       ${d}`)
    if (c.log && (!c.ok || c.name === 'e2e' || c.name === 'detector')) say(`       log: ${c.log}`)
  }
  if (!result.ok) process.exitCode = 1
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderPlan(run, dir) {
  const m = run.plan_meta || {}
  const out = [
    `# Plan — ${run.title}`,
    '',
    `Run \`${run.id}\` · ${run.checkpoints.length} checkpoints · status: ${run.status}`,
    '',
  ]
  if (m.summary) out.push(m.summary, '')
  out.push('| # | Checkpoint | Tests | UI | Size |', '|---|---|---|---|---|')
  for (const cp of run.checkpoints) {
    const t = cp.tests || {}
    const tests = cp.tdd_exempt
      ? 'exempt'
      : `${(t.unit || []).length} unit · ${(t.e2e || []).length} e2e`
    out.push(
      `| ${cp.id} | ${cp.title} | ${tests} | ${cp.ui ? 'prototype' : '—'} | ${cp.complexity || '—'} |`,
    )
  }
  out.push('')
  for (const cp of run.checkpoints) {
    out.push(
      `## ${cp.id} — ${cp.title}${cp.status === 'passed' ? ' (passed)' : ''}`,
      '',
      cp.intent,
      '',
      '**Acceptance**',
      '',
    )
    for (const a of cp.acceptance) out.push(`- ${a}`)
    out.push('')
    const t = cp.tests || {}
    if (cp.tdd_exempt) out.push(`**TDD exempt:** ${cp.tdd_exempt}`, '')
    else
      out.push(
        `**Tests first:** ${[...(t.unit || []), ...(t.e2e || [])].map((f) => `\`${f}\``).join(', ')}`,
        '',
      )
    if (cp.ui) {
      out.push(
        `**Prototype:** [${cp.ui.prototype}](${rel(root, path.join(dir, cp.ui.prototype))}) — screens: ${cp.ui.screens.join(' · ')}`,
        '',
      )
    }
    if ((cp.depends_on || []).length) out.push(`**Depends on:** ${cp.depends_on.join(', ')}`, '')
    if ((cp.files || []).length)
      out.push(`**Expected files:** ${cp.files.map((f) => `\`${f}\``).join(', ')}`, '')
  }
  if ((m.out_of_scope || []).length)
    out.push('## Out of scope', '', ...m.out_of_scope.map((x) => `- ${x}`), '')
  if ((m.risks || []).length)
    out.push('## Risks and open questions', '', ...m.risks.map((x) => `- ${x}`), '')
  const file = path.join(dir, 'plan.md')
  fs.writeFileSync(file, out.join('\n'))
  return file
}

function gateMark(g, tree) {
  if (!g) return '–'
  if (g.tree !== tree) return 'stale'
  return g.ok ? 'ok' : 'FAIL'
}

function appendLearnings(run, learnings, round) {
  const file = path.resolve(root, cfg.learnings)
  const date = now().slice(0, 10)
  const blocks = learnings.map((l) =>
    [
      '',
      `### ${l.rule}`,
      '',
      `- **Why:** ${l.why}`,
      ...(l.applies_to ? [`- **Applies to:** ${l.applies_to}`] : []),
      `- **From:** run \`${run.id}\`${round ? `, feedback round ${round}` : ''}, ${date}`,
    ].join('\n'),
  )
  fs.appendFileSync(file, blocks.join('\n') + '\n')
  return file
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const commands = {
  help() {
    say(USAGE)
  },

  async init() {
    const title = pos.join(' ').trim()
    if (!title) refuse('init needs a title: init "Guest tags on the invitation list"')
    const mine = listRuns(root, cfg).filter(
      (r) => !TERMINAL.has(r.status) && sessionId && r.session_id === sessionId,
    )
    if (mine.length && !flags.force)
      refuse(
        `This session already has live run ${mine[0].id} (${mine[0].status}). Finish or \`abort\` it first, or pass --force.`,
      )
    const stamp = now().replace(/[-:]/g, '').replace('T', '-').slice(0, 13)
    const id = `${stamp}-${slugify(title)}`
    const dir = runDir(root, cfg, id)
    if (fs.existsSync(dir)) refuse(`Run directory ${id} already exists.`)
    for (const sub of ['prototypes', 'evidence', 'briefs'])
      fs.mkdirSync(path.join(dir, sub), { recursive: true })
    fs.writeFileSync(
      path.join(dir, 'brief.md'),
      [
        `# ${title}`,
        '',
        '## The request',
        '',
        '<!-- The human’s request, verbatim. -->',
        '',
        '## Clarifications',
        '',
        '<!-- Questions asked before planning, and the answers. -->',
        '',
        '## Constraints',
        '',
        '<!-- Scope, files or areas ruled in or out, backend dependencies, anything the human was explicit about. -->',
        '',
      ].join('\n'),
    )
    const tree = snapshotTree(root)
    say(
      `Capturing baselines (type-check, lint, unit suite) against ${short(tree)} — about a minute…`,
    )
    const baseline = await captureBaselines({ root, cfg, dir })
    const run = {
      version: 1,
      id,
      title,
      session_id: sessionId,
      status: 'planning',
      status_reason: null,
      created_at: now(),
      start_tree: tree,
      baseline: { ...baseline, tree },
      checkpoints: [],
      plan_meta: null,
      final: null,
      feedback: [],
      hook: { consecutive_blocks: 0 },
      history: [],
    }
    save(run, 'init', { tree })
    const lintTotal = Object.values(baseline.lint || {}).reduce(
      (a, f) => a + Object.values(f).reduce((x, y) => x + y, 0),
      0,
    )
    const tscTotal = Object.values(baseline.typecheck || {}).reduce((a, n) => a + n, 0)
    say(`Run ${id} created — ${rel(root, dir)}`)
    say(
      `Baseline: ${tscTotal} type errors, ${lintTotal} lint errors, ${(baseline.unit || []).length} failing unit tests already present (gates only fail on NEW ones).`,
    )
    for (const p of baseline.problems) say(`WARNING: ${p}`)
    if (!sessionId)
      say(
        'WARNING: no CLAUDE_CODE_SESSION_ID in the environment — the Stop hook cannot bind this run. Use `use <id> --session <id>`.',
      )
    say(
      `Next: fill in ${rel(root, path.join(dir, 'brief.md'))}, then spawn the planner (\`${ORCH} brief planner\`).`,
    )
  },

  use() {
    const id = pos[0]
    if (!id) refuse('use <run-id>')
    if (!sessionId) refuse('No session id — pass --session <id>.')
    const run = findRun({ runId: id })
    run.session_id = sessionId
    save(run, 'bind-session', { session: sessionId })
    say(`Run ${run.id} is now bound to this session (${run.status}).`)
  },

  list() {
    const runs = listRuns(root, cfg)
    if (!runs.length) return say('No runs.')
    for (const r of runs)
      say(`${r.session_id === sessionId ? '*' : ' '} ${r.id}  ${r.status.padEnd(22)} ${r.title}`)
  },

  status() {
    const { run, dir } = ctx()
    const tree = snapshotTree(root)
    const p = runProgress(run, tree, cfg)
    if (flags.json) {
      return say(
        JSON.stringify(
          {
            id: run.id,
            status: run.status,
            tree,
            clear: p.clear,
            next: p.next,
            checkpoints: run.checkpoints.map((c) => ({
              id: c.id,
              status: c.status,
              missing: checkpointProgress(c, tree, cfg).missing,
            })),
          },
          null,
          2,
        ),
      )
    }
    say(
      `Run ${run.id} — "${run.title}" — ${run.status}${run.status_reason ? ` (${run.status_reason})` : ''}`,
    )
    say(`tree ${short(tree)} · started from ${short(run.start_tree)} · ${rel(root, dir)}`)
    for (const c of run.checkpoints) {
      const g = c.gates || {}
      if (c.status === 'passed') say(`  [x] ${c.id} ${c.title}`)
      else if (c.status === 'pending') say(`  [ ] ${c.id} ${c.title}`)
      else {
        const adv = g.adversary || {}
        const rounds = (adv.rounds || []).length
        const parts = [
          c.tdd_exempt ? 'red exempt' : `red ${g.red ? (g.red.ok ? 'ok' : 'FAIL') : '–'}`,
          `behavior ${gateMark(g.behavior, tree)}`,
          ...(c.ui
            ? [
                `ui ${g.ui && g.ui.result ? gateMark(g.ui.result, tree) : g.ui && g.ui.collected ? 'collected' : '–'}`,
              ]
            : []),
          `adversary ${adv.approved_tree === tree ? 'ok' : rounds ? `${rounds} round(s)` : '–'}`,
        ]
        say(`  [>] ${c.id} ${c.title} — ${parts.join(' · ')}`)
      }
    }
    if (run.checkpoints.length && run.checkpoints.every((c) => c.status === 'passed'))
      say(`  final gate: ${gateMark(run.final, tree)}`)
    if (p.blockers) for (const b of p.blockers) say(`Open: ${b}`)
    if (p.next) say(`Next: ${p.next}`)
  },

  plan() {
    const file = pos[0]
    if (!file) refuse('plan <plan.json> [--check] [--append]')
    const { run, dir } = ctx()
    let plan
    try {
      plan = readJson(path.resolve(root, file))
    } catch (e) {
      refuse(`Cannot read ${file}: ${e.message}`)
    }
    // --replace-pending: the plan turned out wrong mid-build. Checkpoints already
    // started or passed stay; the not-yet-started ones are replaced, and the
    // human approves the revised remainder like any plan.
    const kept = flags['replace-pending']
      ? run.checkpoints.filter((c) => c.status !== 'pending')
      : run.checkpoints
    const existingIds = flags.append || flags['replace-pending'] ? kept.map((c) => c.id) : []
    const { errors, warnings } = validatePlan(plan, {
      dir,
      cfg,
      existingIds,
      existedAtStart: (f) => treeHasFile(root, run.start_tree, f),
    })
    for (const w of warnings) say(`warning: ${w}`)
    for (const e of errors) say(`error: ${e}`)
    if (errors.length) {
      process.exitCode = 1
      return say(`Plan rejected — ${errors.length} error(s).`)
    }
    if (flags.check) return say(`Plan is valid: ${plan.checkpoints.length} checkpoint(s).`)

    const cps = plan.checkpoints.map((cp) => ({
      ...planFieldsOf(cp),
      status: 'pending',
      gates: {},
    }))
    const version = fs.readdirSync(dir).filter((f) => /^plan\.v\d+\.json$/.test(f)).length + 1
    fs.copyFileSync(path.resolve(root, file), path.join(dir, `plan.v${version}.json`))
    let round
    if (flags.append) {
      requireStatus(run, 'planning')
      run.checkpoints.push(...cps)
      for (const f of run.feedback || []) {
        if (!f.planned) {
          f.planned = true
          round = f.round
        }
      }
      run.final = null
      run.status = 'building'
    } else if (flags['replace-pending']) {
      requireStatus(run, 'needs-human', 'paused', 'building')
      run.checkpoints = [...kept, ...cps]
      run.final = null
      run.resume_to = null
      run.status_reason = null
      run.status = 'awaiting-plan-approval'
    } else {
      requireStatus(run, 'planning', 'awaiting-plan-approval')
      run.checkpoints = cps
      run.plan_meta = {
        summary: plan.summary || null,
        out_of_scope: plan.out_of_scope || [],
        risks: plan.risks || [],
      }
      run.status = 'awaiting-plan-approval'
    }
    if ((plan.learnings || []).length) {
      const lf = appendLearnings(run, plan.learnings, round)
      say(`Appended ${plan.learnings.length} learning(s) to ${rel(root, lf)}.`)
    }
    save(
      run,
      flags.append ? 'plan-append' : flags['replace-pending'] ? 'plan-replace-pending' : 'plan',
      { version, checkpoints: cps.map((c) => c.id) },
    )
    const md = renderPlan(run, dir)
    say(fs.readFileSync(md, 'utf8'))
    say(
      flags.append
        ? `Appended ${cps.length} checkpoint(s) from feedback; building. Next: \`${ORCH} start ${cps[0].id}\`.`
        : `Plan imported (${rel(root, md)}). Show it to the human and STOP for approval; on a yes: \`${ORCH} approve --note "<their words>"\`.`,
    )
  },

  approve() {
    const { run } = ctx()
    requireStatus(run, 'awaiting-plan-approval')
    run.status = 'building'
    run.hook = { consecutive_blocks: 0 }
    save(run, 'plan-approved', flags.note ? { note: flags.note } : undefined)
    const next = run.checkpoints.find((c) => c.status !== 'passed')
    say(
      `Plan approved — building. The Stop hook now holds this session until every gate is clear. Next: ${
        next.status === 'pending'
          ? `\`${ORCH} start ${next.id}\``
          : checkpointProgress(next, snapshotTree(root), cfg).next
      }.`,
    )
  },

  start() {
    const { run } = ctx()
    const cp = findCp(run, pos[0])
    requireStatus(run, 'building')
    const current = run.checkpoints.find((c) => c.status !== 'passed')
    if (current !== cp) refuse(`${current.id} is the current checkpoint.`)
    if (cp.status !== 'pending') refuse(`${cp.id} is already ${cp.status}.`)
    cp.status = 'in-progress'
    cp.start_tree = snapshotTree(root)
    cp.started_at = now()
    save(run, 'start', { cp: cp.id, tree: cp.start_tree })
    say(
      `${cp.id} started at ${short(cp.start_tree)}. Next: \`${ORCH} brief builder ${cp.id}\` and spawn the builder with it.`,
    )
  },

  async gate() {
    const kind = pos[0]
    const { run, dir } = ctx()
    if (kind === 'final') return gateFinal(run, dir)
    const cp = findCp(run, pos[1])
    requireActive(run, cp)
    if (kind === 'red') return gateRed(run, dir, cp)
    if (kind === 'behavior') return gateBehavior(run, dir, cp)
    if (kind === 'ui') return gateUi(run, dir, cp)
    refuse('gate red|behavior|ui <cp>  or  gate final')
  },

  record() {
    const [kind, id, file] = pos
    if (!['ui', 'adversary'].includes(kind) || !id || !file)
      refuse('record ui|adversary <cp> <verdict.json>')
    const { run } = ctx()
    const cp = findCp(run, id)
    requireActive(run, cp)
    let verdict
    try {
      verdict = readJson(path.resolve(root, file))
    } catch (e) {
      refuse(`Cannot read ${file}: ${e.message}`)
    }
    const errors = validateVerdict(verdict, kind)
    if (errors.length)
      refuse(`Verdict file is malformed:\n- ${errors.join('\n- ')}\nSend it back to the reviewer.`)
    const tree = snapshotTree(root)
    if (verdict.reviewed_tree !== tree) {
      refuse(
        `The verdict reviewed ${short(verdict.reviewed_tree)} but the code is now ${short(tree)}. Either the reviewer edited files (reviewers must not), or the code changed after the review — review again.`,
      )
    }
    const blocking = verdict.findings.filter(isBlocking)
    const counts = { blocker: 0, major: 0, minor: 0 }
    for (const f of verdict.findings) counts[f.severity]++
    const passWord = kind === 'ui' ? 'pass' : 'approve'
    if (verdict.verdict === passWord && blocking.length)
      refuse(
        `Inconsistent verdict: "${passWord}" with ${blocking.length} blocker/major finding(s). Send it back.`,
      )
    if (verdict.verdict !== passWord && !blocking.length)
      refuse(
        `Inconsistent verdict: "${verdict.verdict}" with no blocker/major finding — a rejection must say what blocks it. Send it back.`,
      )
    const ok = verdict.verdict === passWord

    if (kind === 'ui') {
      const col = cp.gates.ui && cp.gates.ui.collected
      if (!cp.ui) refuse(`${cp.id} has no UI block.`)
      if (!col || !col.ok || col.tree !== tree)
        refuse(`Collect UI evidence at this tree first: \`gate ui ${cp.id}\`.`)
      cp.gates.ui.result = { ok, tree, at: now(), file: rel(root, file), counts }
      save(run, 'record-ui', { cp: cp.id, ok, counts })
      say(
        `UI ${ok ? 'PASSED' : 'FAILED'} for ${cp.id} at ${short(tree)} (${counts.blocker} blocker, ${counts.major} major, ${counts.minor} minor).`,
      )
    } else {
      const adv = (cp.gates.adversary = cp.gates.adversary || { rounds: [] })
      const round = adv.rounds.length + 1
      adv.rounds.push({ round, tree, at: now(), approved: ok, file: rel(root, file), counts })
      if (ok) adv.approved_tree = tree
      save(run, 'record-adversary', { cp: cp.id, round, ok, counts })
      say(
        `Adversary round ${round} for ${cp.id}: ${ok ? 'APPROVED' : 'REJECTED'} (${counts.blocker} blocker, ${counts.major} major, ${counts.minor} minor).`,
      )
      if (!ok && round >= cfg.adversaryMaxRounds) {
        process.exitCode = 3
        say(
          `That is ${round} rejected rounds — the limit. Escalate: \`${ORCH} escalate "<what the reviewer and fixer disagree on>"\`.`,
        )
      }
    }
    if (!ok) process.exitCode = process.exitCode || 1
    say(`Next: ${checkpointProgress(cp, tree, cfg).next}`)
  },

  complete() {
    const { run } = ctx()
    const cp = findCp(run, pos[0])
    requireActive(run, cp)
    const tree = snapshotTree(root)
    const p = checkpointProgress(cp, tree, cfg)
    if (p.missing.length)
      refuse(`${cp.id} is not clear at ${short(tree)}: ${p.missing.join('; ')}.\nNext: ${p.next}`)
    cp.status = 'passed'
    cp.passed_tree = tree
    cp.passed_at = now()
    save(run, 'complete', { cp: cp.id, tree })
    const next = run.checkpoints.find((c) => c.status !== 'passed')
    say(`${cp.id} passed at ${short(tree)}.`)
    say(
      next
        ? `Next: \`${ORCH} start ${next.id}\`.`
        : `All checkpoints passed. Next: \`${ORCH} gate final\`.`,
    )
  },

  brief() {
    const [role, id] = pos
    if (!role) refuse('brief <planner|builder|ui-reviewer|adversary|fixer> [cp]')
    const { run, dir } = ctx()
    // A fixer with no checkpoint is the final-gate fixer.
    const cp = role === 'planner' || (role === 'fixer' && !id) ? null : findCp(run, id)
    const tree = snapshotTree(root)
    const file = writeBrief({ role, run, cp, root, dir, cfg, tree })
    say(rel(root, file))
  },

  diff() {
    const { run, dir } = ctx()
    const tree = snapshotTree(root)
    const cp = pos[0] ? findCp(run, pos[0]) : null
    const from = cp ? cp.start_tree : run.start_tree
    if (!from) refuse(`${cp.id} has not started.`)
    const file = path.join(evDir(dir, cp), `diff-${short(from)}-${short(tree)}.patch`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, diffPatch(root, from, tree))
    say(diffStat(root, from, tree) || '(no changes)')
    say(rel(root, file))
  },

  tree() {
    say(snapshotTree(root))
  },

  'review-ready'() {
    const { run, dir } = ctx()
    requireStatus(run, 'building')
    const tree = snapshotTree(root)
    const p = runProgress(run, tree, cfg)
    if (!p.clear) refuse(`Not clear: ${(p.blockers || []).join('; ')}.\nNext: ${p.next}`)
    const patch = path.join(dir, 'evidence', `run-${short(tree)}.patch`)
    fs.writeFileSync(patch, diffPatch(root, run.start_tree, tree))
    const out = [
      `# Ready for review — ${run.title}`,
      '',
      `Run \`${run.id}\` · ${run.checkpoints.length} checkpoint(s) · every gate clear at tree \`${short(tree)}\`. Nothing is committed.`,
      '',
      '## What changed',
      '',
      '```',
      diffStat(root, run.start_tree, tree) || '(no changes)',
      '```',
      '',
      `Full diff: \`${rel(root, patch)}\``,
      '',
    ]
    // Anything changed after the last checkpoint passed (a final-gate fix) was
    // never in front of an adversary — say so rather than let it ride along.
    const lastPassed = run.checkpoints[run.checkpoints.length - 1].passed_tree
    if (lastPassed && lastPassed !== tree) {
      const late = path.join(dir, 'evidence', `after-last-checkpoint-${short(tree)}.patch`)
      fs.writeFileSync(late, diffPatch(root, lastPassed, tree))
      out.push(
        '## Changed after the last checkpoint passed — not adversarially reviewed',
        '',
        'The final gate needed a fix. Tests, type-check and lint pass with it, but no reviewer has read it. Look at it yourself:',
        '',
        '```',
        diffStat(root, lastPassed, tree),
        '```',
        '',
        `\`${rel(root, late)}\``,
        '',
      )
    }
    out.push('## Checkpoints', '')
    const minors = []
    for (const c of run.checkpoints) {
      const adv = (c.gates && c.gates.adversary) || { rounds: [] }
      const approved =
        adv.rounds.find((r) => r.approved && r.tree === c.passed_tree) ||
        adv.rounds[adv.rounds.length - 1]
      const ui = c.gates && c.gates.ui && c.gates.ui.result
      out.push(
        `- **${c.id} — ${c.title}** — adversary approved in round ${approved ? approved.round : '?'}${ui ? `; UI passed (${rel(root, path.resolve(root, ui.file))})` : ''}`,
      )
      for (const f of [approved && approved.file, ui && ui.file].filter(Boolean)) {
        try {
          for (const finding of readJson(path.resolve(root, f)).findings || []) {
            if (finding.severity === 'minor')
              minors.push(
                `${c.id}: ${finding.file ? `\`${finding.file}${finding.line ? `:${finding.line}` : ''}\` — ` : ''}${finding.claim || finding.actual || finding.summary || ''}`,
              )
          }
        } catch {
          /* a missing verdict file only costs the minor notes */
        }
      }
    }
    if (minors.length)
      out.push(
        '',
        '## Minor notes the reviewers left (not blocking)',
        '',
        ...minors.map((m) => `- ${m}`),
      )
    out.push(
      '',
      '## Your review',
      '',
      'Accept it, or say what to change. Changes become new checkpoints; anything that is a rule for next time also becomes a learning.',
      '',
    )
    const file = path.join(dir, 'review.md')
    fs.writeFileSync(file, out.join('\n'))
    run.status = 'awaiting-final-review'
    save(run, 'review-ready', { tree })
    say(out.join('\n'))
    say(`(${rel(root, file)})`)
  },

  feedback() {
    const src = pos[0]
    if (!src) refuse('feedback <notes.md> — write the human’s review notes to a file first')
    const { run, dir } = ctx()
    requireStatus(run, 'awaiting-final-review')
    const round = (run.feedback || []).length + 1
    const dest = path.join(dir, `feedback-${round}.md`)
    fs.copyFileSync(path.resolve(root, src), dest)
    run.feedback = run.feedback || []
    run.feedback.push({ round, at: now(), file: rel(root, dest), planned: false })
    run.final = null
    run.status = 'planning'
    save(run, 'feedback', { round })
    say(
      `Feedback round ${round} recorded. Next: \`${ORCH} brief planner\` (it plans only the new work), then \`${ORCH} plan <file> --append\`.`,
    )
  },

  escalate() {
    return setWaiting('needs-human')
  },
  pause() {
    return setWaiting('paused')
  },

  resume() {
    const { run } = ctx()
    requireStatus(run, 'needs-human', 'paused')
    run.status = run.resume_to || 'building'
    run.status_reason = null
    run.resume_to = null
    run.hook = { consecutive_blocks: 0 }
    save(run, 'resume', flags.note ? { note: flags.note } : undefined)
    say(`Resumed — ${run.status}.`)
  },

  done() {
    const { run } = ctx()
    requireStatus(run, 'awaiting-final-review')
    run.status = 'done'
    save(run, 'done', flags.note ? { note: flags.note } : undefined)
    say(`Run ${run.id} done. Committing is the human's call — ask before you touch git.`)
  },

  abort() {
    const { run } = ctx()
    if (TERMINAL.has(run.status)) refuse(`Run is already ${run.status}.`)
    const reason = pos.join(' ').trim()
    if (!reason) refuse('abort "<reason>"')
    run.status = 'aborted'
    run.status_reason = reason
    save(run, 'abort', { reason })
    say(`Run ${run.id} aborted. The working tree is untouched.`)
  },
}

function setWaiting(status) {
  const { run } = ctx()
  if (TERMINAL.has(run.status)) refuse(`Run is ${run.status}.`)
  const reason = pos.join(' ').trim()
  if (reason.length < 10)
    refuse(`${status === 'paused' ? 'pause' : 'escalate'} needs a reason the human can act on.`)
  if (run.status !== 'needs-human' && run.status !== 'paused') run.resume_to = run.status
  run.status = status
  run.status_reason = reason
  save(run, status, { reason })
  say(`Run ${run.id} is ${status}: ${reason}\nTell the human; \`resume\` once they answer.`)
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

async function gateRed(run, dir, cp) {
  if (cp.tdd_exempt)
    refuse(`${cp.id} is TDD-exempt (${cp.tdd_exempt}) — go straight to \`gate behavior\`.`)
  const tree = snapshotTree(root)
  const ev = evDir(dir, cp)
  const tag = `red-${short(tree)}`
  const unit = cp.tests.unit || []
  const e2e = cp.tests.e2e || []
  const pre = []
  const nonTest = changedFiles(root, cp.start_tree, tree).filter((c) => !isTestFile(cfg, c.file))
  if (nonTest.length) {
    pre.push({
      name: 'tests-first',
      ok: false,
      summary: `only tests may change before red — revert these, or move them after the red gate: ${nonTest.map((c) => c.file).join(', ')}`,
      log: null,
    })
  }
  const absent = [...unit, ...e2e].filter((f) => !fs.existsSync(path.resolve(root, f)))
  if (absent.length)
    pre.push({
      name: 'planned',
      ok: false,
      summary: `planned test files missing: ${absent.join(', ')}`,
      log: null,
    })
  let result
  if (pre.length) result = { ok: false, tree, at: now(), checks: pre }
  else {
    const checks = [
      unit.length
        ? await unitCheck({ run, ev, tag, files: unit, planned: unit, mode: 'red' })
        : null,
      await e2eCheck({ ev, tag, files: e2e, expect: 'fail' }),
    ]
    result = seal(checks, tree)
  }
  if (result.ok)
    result.test_hashes = Object.fromEntries([...unit, ...e2e].map((f) => [f, fileHash(root, f)]))
  cp.gates.red = result
  save(run, 'gate-red', { cp: cp.id, ok: result.ok })
  printGate(`gate red ${cp.id}`, result)
  if (result.ok)
    say(`Now implement ${cp.id}, then \`${ORCH} gate behavior ${cp.id} --run ${run.id}\`.`)
}

async function gateBehavior(run, dir, cp) {
  if (!cp.tdd_exempt && !(cp.gates.red && cp.gates.red.ok))
    refuse(`${cp.id} has no red gate yet — tests first: \`gate red ${cp.id}\`.`)
  const tree = snapshotTree(root)
  const ev = evDir(dir, cp)
  const tag = `behavior-${short(tree)}`
  // vue-tsc runs on its own: beside the unit suite it starves timing-sensitive specs.
  const [unit, lint] = await Promise.all([
    unitCheck({
      run,
      ev,
      tag,
      files: cfg.unitRoots,
      planned: cp.tests.unit || [],
      mode: 'green',
      tree,
    }),
    lintCheck({ run, ev, tag, tree }),
  ])
  const typecheck = await typecheckCheck({ run, ev, tag })
  const e2e = await e2eCheck({ ev, tag, files: cp.tests.e2e || [], expect: 'pass' })
  const result = seal([unit, e2e, typecheck, lint], tree)
  const red = cp.gates.red
  if (red && red.tree) {
    result.tests_changed_since_red = changedFiles(root, red.tree, tree)
      .map((c) => c.file)
      .filter((f) => isTestFile(cfg, f))
  }
  cp.gates.behavior = result
  save(run, 'gate-behavior', { cp: cp.id, ok: result.ok })
  printGate(`gate behavior ${cp.id}`, result)
  if ((result.tests_changed_since_red || []).length)
    say(
      `note: tests changed after red: ${result.tests_changed_since_red.join(', ')} — the adversary will check none were weakened.`,
    )
  say(`Next: ${checkpointProgress(cp, tree, cfg).next}`)
}

function pngsUnder(d) {
  if (!fs.existsSync(d)) return []
  return fs
    .readdirSync(d, { recursive: true })
    .map((f) => path.join(d, String(f)))
    .filter((f) => f.endsWith('.png'))
}

async function gateUi(run, dir, cp) {
  if (!cp.ui) refuse(`${cp.id} has no UI block — it goes straight from behavior to the adversary.`)
  const tree = snapshotTree(root)
  const g = cp.gates.behavior
  if (!(g && g.ok && g.tree === tree))
    refuse(`Behavior is not passing at this tree — \`gate behavior ${cp.id}\` first.`)
  const ev = evDir(dir, cp)
  const tag = `ui-${short(tree)}`
  const uiDir = path.join(ev, tag)
  fs.rmSync(uiDir, { recursive: true, force: true })
  fs.mkdirSync(uiDir, { recursive: true })

  const app = await e2eCheck({
    ev,
    tag,
    files: cp.tests.e2e,
    expect: 'pass',
    env: { ORCH_UI_SHOTS: '1' },
    outDir: path.join(uiDir, 'app'),
  })
  const appShots = pngsUnder(path.join(uiDir, 'app'))
  if (app && app.ok && !appShots.length) {
    app.ok = false
    app.summary =
      'the specs passed but left no screenshots — is ORCH_UI_SHOTS wired into playwright.config.ts?'
  }

  const htmlFile = path.resolve(dir, cp.ui.prototype)
  let protoShots = []
  let proto = null
  if (cfg.prototypeShots) {
    try {
      const { shootPrototype } = await import('./lib/prototype-shots.mjs')
      protoShots = await shootPrototype({
        root,
        htmlFile,
        outDir: uiDir,
        viewports: cfg.prototypeViewports,
      })
      proto = {
        name: 'prototype',
        ok: true,
        summary: `${protoShots.length} screenshot(s)`,
        log: null,
      }
    } catch (e) {
      proto = {
        name: 'prototype',
        ok: false,
        summary: `could not screenshot the prototype: ${e.message}`,
        log: null,
      }
    }
  }

  let detector = null
  const uiFiles = changedFiles(root, cp.start_tree, tree)
    .filter((c) => c.status !== 'D' && matchesAny(c.file, cfg.uiFilePatterns))
    .map((c) => c.file)
  if (cfg.commands.detector && uiFiles.length) {
    const res = await runCommand(renderCommand(cfg.commands.detector, { files: uiFiles }), {
      cwd: root,
      logFile: path.join(uiDir, 'detector.log'),
      timeoutMs: cfg.timeouts.lint * 1000,
    })
    // Advisory: the detector's false-positive rate here is known (see CLAUDE.md), so it informs the reviewer and never fails the gate.
    detector = {
      name: 'detector',
      ok: true,
      summary: `advisory, exit ${res.code} — the reviewer weighs it`,
      log: rel(root, res.logFile),
    }
  }

  const manifestFile = path.join(uiDir, 'manifest.json')
  fs.writeFileSync(
    manifestFile,
    JSON.stringify(
      {
        tree,
        checkpoint: cp.id,
        prototype: rel(root, htmlFile),
        prototype_shots: protoShots.map((f) => rel(root, f)),
        app_shots: appShots.map((f) => rel(root, f)),
        screens: cp.ui.screens,
        detector_log: detector && detector.log,
        changed_ui_files: uiFiles,
      },
      null,
      2,
    ),
  )
  const result = seal([app, proto, detector], tree)
  cp.gates.ui = {
    ...(cp.gates.ui || {}),
    collected: { ...result, manifest: rel(root, manifestFile) },
  }
  save(run, 'gate-ui', { cp: cp.id, ok: result.ok })
  printGate(`gate ui ${cp.id} (evidence)`, result)
  say(
    `manifest: ${rel(root, manifestFile)} — ${appShots.length} app shot(s), ${protoShots.length} prototype shot(s)`,
  )
  if (result.ok)
    say(`Next: \`${ORCH} brief ui-reviewer ${cp.id}\` and spawn the ui-reviewer with it.`)
}

async function gateFinal(run, dir) {
  requireStatus(run, 'building')
  const open = run.checkpoints.filter((c) => c.status !== 'passed')
  if (open.length) refuse(`Checkpoints still open: ${open.map((c) => c.id).join(', ')}.`)
  const tree = snapshotTree(root)
  const ev = evDir(dir, null)
  const tag = `final-${short(tree)}`
  const e2eFiles = [...new Set(run.checkpoints.flatMap((c) => (c.tests && c.tests.e2e) || []))]
  const [unit, lint] = await Promise.all([
    unitCheck({
      run,
      ev,
      tag,
      files: cfg.unitRoots,
      planned: [...new Set(run.checkpoints.flatMap((c) => (c.tests && c.tests.unit) || []))],
      mode: 'green',
      tree,
    }),
    lintCheck({ run, ev, tag, tree }),
  ])
  const typecheck = await typecheckCheck({ run, ev, tag })
  const e2e = await e2eCheck({ ev, tag, files: e2eFiles, expect: 'pass' })
  const result = seal([unit, e2e, typecheck, lint], tree)
  run.final = result
  save(run, 'gate-final', { ok: result.ok })
  printGate('gate final', result)
  say(
    result.ok
      ? `Next: \`${ORCH} review-ready\`.`
      : 'Fix what failed (spawn a fixer or builder with the log), then `gate final` again.',
  )
}

// ---------------------------------------------------------------------------

const handler = commands[command || 'help']
if (!handler) {
  console.error(`Unknown command "${command}".\n\n${USAGE}`)
  process.exit(2)
}
try {
  await handler()
} catch (e) {
  if (e instanceof Refusal) {
    console.error(`refused: ${e.message}`)
    process.exit(2)
  }
  throw e
}
