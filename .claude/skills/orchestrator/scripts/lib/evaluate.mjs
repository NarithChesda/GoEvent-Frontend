/**
 * "Where is this run, and what is the one next step?" — shared by `status`
 * and the Stop hook, so the hook's block message and the orchestrator's own
 * view can never disagree.
 *
 * A gate counts only if it was recorded against the CURRENT tree. Code edited
 * after a gate passed makes that gate stale, whatever it said at the time.
 */
export const ORCH = 'node .claude/skills/orchestrator/scripts/orch.mjs'

const fresh = (g, tree) => !!g && g.ok === true && g.tree === tree

export function checkpointProgress(cp, tree, cfg) {
  const g = cp.gates || {}
  const id = cp.id
  if (cp.status === 'passed') return { done: true, missing: [], next: null }
  if (cp.status === 'pending') {
    return {
      done: false,
      missing: ['not started'],
      next: `\`${ORCH} start ${id}\`, then spawn the builder: \`${ORCH} brief builder ${id}\``,
    }
  }

  const missing = []
  if (!cp.tdd_exempt && !(g.red && g.red.ok))
    missing.push('red (tests first, failing for the right reason)')
  const behaviorOk = fresh(g.behavior, tree)
  if (!behaviorOk)
    missing.push(
      g.behavior && g.behavior.tree === tree
        ? 'behavior (FAILING at this tree)'
        : 'behavior (missing or stale)',
    )

  const needsUi = !!cp.ui
  const uiCollected =
    needsUi && g.ui && g.ui.collected && g.ui.collected.ok && g.ui.collected.tree === tree
  const uiResult = needsUi && g.ui && g.ui.result
  const uiOk = !needsUi || (uiResult && uiResult.tree === tree && uiResult.ok)
  if (needsUi && !uiOk) {
    missing.push(
      uiResult && uiResult.tree === tree
        ? 'ui (reviewer FAILED it at this tree)'
        : 'ui (missing or stale)',
    )
  }

  const adv = g.adversary || { rounds: [] }
  const rounds = adv.rounds || []
  const last = rounds[rounds.length - 1]
  const advOk = adv.approved_tree === tree
  if (!advOk)
    missing.push(
      last && last.tree === tree && !last.approved
        ? 'adversary (REJECTED at this tree)'
        : 'adversary (missing or stale)',
    )

  let next
  if (!cp.tdd_exempt && !(g.red && g.red.ok)) {
    next = `spawn the builder (\`${ORCH} brief builder ${id}\`) — it writes the tests and records \`gate red\` before any code`
  } else if (!behaviorOk) {
    next =
      g.behavior && g.behavior.tree === tree
        ? `behavior is failing — send the builder (or fixer) back to it; it re-runs \`${ORCH} gate behavior ${id}\``
        : `\`${ORCH} gate behavior ${id}\``
  } else if (needsUi && !uiCollected) {
    next = `\`${ORCH} gate ui ${id}\` (screenshots + prototype shots), then the ui-reviewer`
  } else if (needsUi && !(uiResult && uiResult.tree === tree)) {
    next = `spawn the ui-reviewer: \`${ORCH} brief ui-reviewer ${id}\`, then \`${ORCH} record ui ${id} <verdict.json>\``
  } else if (needsUi && !uiResult.ok) {
    next = `spawn the fixer on the UI findings: \`${ORCH} brief fixer ${id}\``
  } else if (!advOk && last && last.tree === tree && !last.approved) {
    next =
      rounds.length >= cfg.adversaryMaxRounds
        ? `the adversary has rejected ${rounds.length} rounds — \`${ORCH} escalate "<what is contested>"\` and ask the human`
        : `spawn the fixer on round ${last.round}'s findings: \`${ORCH} brief fixer ${id}\``
  } else if (!advOk) {
    next = `spawn the adversary: \`${ORCH} brief adversary ${id}\`, then \`${ORCH} record adversary ${id} <verdict.json>\``
  } else {
    next = `\`${ORCH} complete ${id}\``
  }
  return { done: false, missing, next }
}

export function runProgress(run, tree, cfg) {
  const cps = run.checkpoints || []
  const current = cps.find((c) => c.status !== 'passed')
  if (run.status === 'planning')
    return {
      clear: true,
      next: `spawn the planner: \`${ORCH} brief planner\`, then \`${ORCH} plan <plan.json>\``,
    }
  if (run.status === 'awaiting-plan-approval')
    return { clear: true, next: 'wait for the human to approve the plan, then `approve`' }
  if (run.status === 'awaiting-final-review')
    return { clear: true, next: 'wait for the human’s review: `done`, or `feedback <notes.md>`' }
  if (run.status === 'needs-human' || run.status === 'paused')
    return {
      clear: true,
      next: `waiting on the human (${run.status_reason || run.status}); \`resume\` once they answer`,
    }
  if (run.status === 'done' || run.status === 'aborted') return { clear: true, next: null }

  // building
  if (current) {
    const p = checkpointProgress(current, tree, cfg)
    const remaining = cps.filter((c) => c.status !== 'passed').length
    return {
      clear: false,
      checkpoint: current.id,
      blockers: [
        `${current.id} "${current.title}": ${p.missing.join('; ')}`,
        ...(remaining > 1 ? [`${remaining - 1} more checkpoint(s) after it`] : []),
      ],
      next: p.next,
    }
  }
  const final = run.final
  if (!fresh(final, tree)) {
    return {
      clear: false,
      blockers: [
        final && final.tree === tree
          ? 'final gate FAILING at this tree'
          : 'final gate missing or stale',
      ],
      next:
        final && final.tree === tree
          ? `fix what \`gate final\` reported, then \`${ORCH} gate final\``
          : `\`${ORCH} gate final\``,
    }
  }
  return { clear: true, next: `\`${ORCH} review-ready\` and hand the result to the human` }
}
