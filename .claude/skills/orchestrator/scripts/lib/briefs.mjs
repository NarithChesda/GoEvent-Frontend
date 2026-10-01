/**
 * Writes the one file a sub-agent is handed. Each brief names the role file
 * to follow, the exact inputs (diffs, screenshots, prior rounds — all written
 * to disk here so the agent reads them rather than the orchestrator pasting
 * them into its own context), the commands to run, and where the output goes.
 *
 * Every command in a brief carries `--run <id>`, so a sub-agent never depends
 * on which session it was spawned from.
 */
import fs from 'node:fs'
import path from 'node:path'
import { rel } from './core.mjs'
import { ORCH } from './evaluate.mjs'
import { changedFiles, diffPatch } from './git.mjs'

const short = (tree) => String(tree).slice(0, 8)

const PLAN_FIELDS = [
  'id',
  'title',
  'intent',
  'depends_on',
  'files',
  'acceptance',
  'tests',
  'tdd_exempt',
  'ui',
  'complexity',
  'notes',
]

export function planFieldsOf(cp) {
  const out = {}
  for (const k of PLAN_FIELDS) if (cp[k] !== undefined) out[k] = cp[k]
  return out
}

function header({ role, run, root, dir, cp, cfg }) {
  const title = cp ? `${cp.id} "${cp.title}"` : `"${run.title}"`
  return [
    `# ${role} brief — run ${run.id}, ${title}`,
    '',
    'You are a sub-agent in the orchestrator pipeline, working in a fresh context. Read these first, in order:',
    '',
    `1. \`.claude/skills/orchestrator/roles/${role}.md\` — your job, your limits and your output contract.`,
    `2. \`${cfg.learnings}\` — rules distilled from past human reviews. They override your own defaults.`,
    `3. \`${rel(root, path.join(dir, 'brief.md'))}\` — the feature, as the human asked for it.`,
    '',
    `Repo root: \`${root}\` — run every command from there. The orchestrator CLI is \`${ORCH} … --run ${run.id}\`.`,
    '',
  ]
}

function writePatch(evDir, name, content) {
  fs.mkdirSync(evDir, { recursive: true })
  const file = path.join(evDir, name)
  fs.writeFileSync(file, content || '(no changes)\n')
  return file
}

function cpBlock(cp) {
  return ['## The checkpoint', '', '```json', JSON.stringify(planFieldsOf(cp), null, 2), '```', '']
}

function earlierBlock(run, cp) {
  const before = run.checkpoints.slice(0, run.checkpoints.indexOf(cp))
  if (!before.length) return []
  return [
    '## Earlier checkpoints (already passed — build on them, do not redo or break them)',
    '',
    ...before.map((c) => `- ${c.id} — ${c.title}`),
    '',
  ]
}

export function writeBrief({ role, run, cp, root, dir, cfg, tree }) {
  const ev = cp ? path.join(dir, 'evidence', cp.id) : path.join(dir, 'evidence')
  const lines = header({ role, run, root, dir, cp, cfg })
  const r = (p) => rel(root, p)
  let file

  if (role === 'planner') {
    const feedback = (run.feedback || []).filter((f) => !f.planned)
    const next = 1 + Math.max(0, ...run.checkpoints.map((c) => Number(c.id.slice(3))))
    lines.push(
      '## Your inputs',
      '',
      `- Plan format: \`.claude/skills/orchestrator/schema/plan.schema.json\` and the example \`.claude/skills/orchestrator/schema/plan.example.json\`.`,
      `- Write the plan to: \`${r(path.join(dir, 'plan.draft.json'))}\``,
      `- Write each UI checkpoint's prototype to: \`${r(path.join(dir, 'prototypes'))}/<cp-id>.html\``,
      '',
    )
    if (feedback.length) {
      lines.push(
        '## This is a FEEDBACK round — plan only the new work',
        '',
        'The human reviewed the finished feature and asked for changes. Turn their notes into NEW checkpoints only;',
        `the ones below are done and stay done. Number the new ones from cp-${String(next).padStart(2, '0')}.`,
        'Also propose `learnings` for any note that is a rule for next time, not just a fix for this feature.',
        '',
        ...feedback.map((f) => `- Feedback: \`${f.file}\``),
        `- Current plan: \`${r(path.join(dir, 'plan.md'))}\``,
        '',
      )
    }
    lines.push(
      '## When you are done',
      '',
      `Validate without importing: \`${ORCH} plan ${r(path.join(dir, 'plan.draft.json'))} --check --run ${run.id}\`. Fix every error it reports.`,
      'Reply with at most 10 lines: the checkpoint titles in order and any question that only the human can answer.',
      '',
    )
    file = path.join(
      dir,
      'briefs',
      feedback.length ? `planner-feedback-${feedback.length}.md` : 'planner.md',
    )
  } else if (role === 'builder') {
    lines.push(...cpBlock(cp), ...earlierBlock(run, cp))
    if (cp.ui)
      lines.push(
        '## The prototype this must match',
        '',
        `\`${r(path.join(dir, cp.ui.prototype))}\``,
        '',
      )
    lines.push(
      '## Commands',
      '',
      ...(cp.tdd_exempt
        ? [
            `- This checkpoint is TDD-exempt (${cp.tdd_exempt}). Implement, then \`${ORCH} gate behavior ${cp.id} --run ${run.id}\` until it passes.`,
          ]
        : [
            `1. Write the planned tests. Touch nothing else yet.`,
            `2. \`${ORCH} gate red ${cp.id} --run ${run.id}\` — must pass (your tests fail, for the right reason). Read the log it names.`,
            `3. Implement. Then \`${ORCH} gate behavior ${cp.id} --run ${run.id}\` until it passes.`,
          ]),
      '',
      '## Report back',
      '',
      'At most 15 lines: files changed, decisions you made that the plan did not, and anything the plan got wrong.',
      '',
    )
    file = path.join(dir, 'briefs', `${cp.id}-builder.md`)
  } else if (role === 'ui-reviewer') {
    const ui = (cp.gates && cp.gates.ui) || {}
    const manifest = ui.collected && ui.collected.manifest
    const prev = ui.result
    const out = path.join(ev, `ui-verdict-${short(tree)}.json`)
    lines.push(...cpBlock(cp))
    lines.push(
      '## What to review',
      '',
      `- Tree under review: \`${tree}\` — copy it into \`reviewed_tree\`.`,
      `- Evidence manifest (prototype shots, app shots, detector output): \`${manifest}\``,
      `- Prototype source: \`${r(path.join(dir, cp.ui.prototype))}\``,
      '- Screens the e2e tests end on, in order:',
      ...cp.ui.screens.map((s) => `  - ${s}`),
    )
    if (prev && prev.tree !== tree) {
      const delta = writePatch(
        ev,
        `ui-delta-${short(prev.tree)}-${short(tree)}.patch`,
        diffPatch(root, prev.tree, tree),
      )
      lines.push(
        `- Your previous verdict (at an older tree): \`${prev.file}\``,
        `- What changed since then: \`${r(delta)}\` — confirm the old findings are resolved, and that nothing new broke.`,
      )
    }
    lines.push(
      '',
      '## Output',
      '',
      `Write your verdict JSON to \`${r(out)}\`. Reply with only that path and the word pass or fail.`,
      '',
    )
    file = path.join(dir, 'briefs', `${cp.id}-ui-reviewer-${short(tree)}.md`)
  } else if (role === 'adversary') {
    const adv = (cp.gates && cp.gates.adversary) || { rounds: [] }
    const rounds = adv.rounds || []
    const round = rounds.length + 1
    const full = writePatch(ev, `diff-${short(tree)}.patch`, diffPatch(root, cp.start_tree, tree))
    lines.push(...cpBlock(cp))
    lines.push(
      '## Review target',
      '',
      `- Tree under review: \`${tree}\` — copy it into \`reviewed_tree\`.`,
      `- Everything this checkpoint changed: \`${r(full)}\``,
    )
    const red = cp.gates && cp.gates.red
    if (red && red.tree !== tree) {
      const tests = changedFiles(root, red.tree, tree)
        .map((c) => c.file)
        .filter(
          (f) =>
            (cp.tests.unit || []).concat(cp.tests.e2e || []).includes(f) ||
            /\.(spec|test)\.[cm]?[jt]sx?$/.test(f),
        )
      if (tests.length) {
        const patch = writePatch(
          ev,
          `tests-since-red-${short(tree)}.patch`,
          diffPatch(root, red.tree, tree, tests),
        )
        lines.push(
          `- Tests edited AFTER they were shown failing: \`${r(patch)}\` — check none of it weakens what the test proves.`,
        )
      }
    }
    const behavior = cp.gates && cp.gates.behavior
    if (behavior)
      lines.push(
        `- Latest behavior gate: ${behavior.ok ? 'passed' : 'FAILED'} — logs: ${behavior.checks.map((c) => `\`${c.log}\``).join(', ')}`,
      )
    if (rounds.length) {
      const last = rounds[rounds.length - 1]
      lines.push('', `## Earlier rounds — this is round ${round}`, '')
      for (const rd of rounds) {
        const fixer = path.join(ev, `fixer-r${rd.round}.json`)
        lines.push(
          `- Round ${rd.round}: \`${rd.file}\`${fs.existsSync(fixer) ? ` — fixer's response: \`${r(fixer)}\`` : ''}`,
        )
      }
      if (last.tree !== tree) {
        const delta = writePatch(
          ev,
          `delta-${short(last.tree)}-${short(tree)}.patch`,
          diffPatch(root, last.tree, tree),
        )
        lines.push(`- What changed since round ${last.round}: \`${r(delta)}\``)
      }
      lines.push(
        '',
        'A finding the fixer disputed stays closed unless you can show, with evidence, that the dispute is wrong. Do not re-raise it in new words.',
      )
    }
    const out = path.join(ev, `adversary-r${round}.json`)
    lines.push(
      '',
      '## Output',
      '',
      `Write your verdict JSON to \`${r(out)}\`. Reply with only that path and the word approve or reject.`,
      '',
    )
    file = path.join(dir, 'briefs', `${cp.id}-adversary-r${round}.md`)
  } else if (role === 'fixer' && !cp) {
    // Every checkpoint passed on its own; the final gate re-ran everything at
    // the final tree and something broke across them.
    const final = run.final
    if (!final || final.ok || final.tree !== tree)
      throw new Error('No failing final gate at this tree — nothing for a final fixer to fix.')
    const full = writePatch(ev, `run-${short(tree)}.patch`, diffPatch(root, run.start_tree, tree))
    const out = path.join(ev, 'final', `fixer-${short(tree)}.json`)
    lines.push(
      '## The final gate failed',
      '',
      'Every checkpoint passed its own gates. The final gate re-ran the whole unit suite, every checkpoint’s e2e specs, the type-check and lint at the final tree — and this broke:',
      '',
      ...final.checks.map(
        (c) =>
          `- ${c.ok ? 'ok' : 'FAIL'} ${c.name}: ${c.summary}${c.log ? ` — log \`${c.log}\`` : ''}`,
      ),
      '',
      `- The whole run's diff: \`${r(full)}\``,
      `- The checkpoints, in order: ${run.checkpoints.map((c) => `${c.id} ${c.title}`).join('; ')}`,
      '',
      'Make the smallest fix that restores what broke. This fix gets no adversarial round of its own — the human sees it separately in the review — so do not use it to add or rework features.',
      '',
      '## Commands',
      '',
      `- After your change: \`${ORCH} gate final --run ${run.id}\` — it must pass before you report back.`,
      '',
      '## Output',
      '',
      `Write your response JSON to \`${r(out)}\` (one response per failing check). Reply with only that path.`,
      '',
    )
    file = path.join(dir, 'briefs', `final-fixer-${short(tree)}.md`)
  } else if (role === 'fixer') {
    const g = cp.gates || {}
    const uiFailed = cp.ui && g.ui && g.ui.result && g.ui.result.tree === tree && !g.ui.result.ok
    const rounds = (g.adversary && g.adversary.rounds) || []
    const last = rounds[rounds.length - 1]
    const source = uiFailed
      ? { kind: 'UI review', file: g.ui.result.file }
      : last
        ? { kind: `adversary round ${last.round}`, file: last.file }
        : null
    if (!source) throw new Error(`Nothing for a fixer to fix on ${cp.id} at this tree.`)
    const full = writePatch(ev, `diff-${short(tree)}.patch`, diffPatch(root, cp.start_tree, tree))
    const out = uiFailed
      ? path.join(ev, `fixer-ui-${short(tree)}.json`)
      : path.join(ev, `fixer-r${last.round}.json`)
    lines.push(...cpBlock(cp))
    if (cp.ui) lines.push('## The prototype', '', `\`${r(path.join(dir, cp.ui.prototype))}\``, '')
    lines.push(
      '## Findings to address',
      '',
      `- From the ${source.kind}: \`${source.file}\``,
      `- The checkpoint's diff so far: \`${r(full)}\``,
      '',
      '## Commands',
      '',
      `- After your changes: \`${ORCH} gate behavior ${cp.id} --run ${run.id}\` — it must pass before you report back.`,
      '',
      '## Output',
      '',
      `Write your response JSON to \`${r(out)}\`. Reply with only that path.`,
      '',
    )
    file = path.join(dir, 'briefs', `${cp.id}-fixer-${short(tree)}.md`)
  } else {
    throw new Error(
      `Unknown role "${role}". Roles: planner, builder, ui-reviewer, adversary, fixer.`,
    )
  }

  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, lines.join('\n'))
  return file
}
