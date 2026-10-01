#!/usr/bin/env node
/**
 * Stop hook for the orchestrator skill.
 *
 * While THIS session's run is `building`, the session may not end its turn
 * until every gate is clear at the current working tree: the hook answers
 * `{"decision":"block","reason":…}` and the reason — what is open and the one
 * next step — is fed straight back to the model.
 *
 * It is silent for every other session and every other status: planning,
 * awaiting approval, awaiting review, needs-human and paused are all places
 * the orchestrator is meant to stop.
 *
 * Two safety valves:
 *  - Stall: blocked `hookMaxStalledBlocks` times in a row with neither the
 *    code nor the run changing, the run is marked needs-human and the stop
 *    is allowed, rather than looping forever.
 *  - Fail open: any error in here lets the stop through. A broken dev tool
 *    must never trap a session.
 */
import fs from 'node:fs'
import {
  ENFORCED,
  TERMINAL,
  listRuns,
  loadConfig,
  runsDir,
  saveRun,
  saveRunQuietly,
} from './lib/core.mjs'
import { ORCH, runProgress } from './lib/evaluate.mjs'
import { repoRoot, snapshotTree } from './lib/git.mjs'

async function readStdin() {
  if (process.stdin.isTTY) return ''
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const emit = (obj) => process.stdout.write(JSON.stringify(obj) + '\n')

async function main() {
  let input = {}
  try {
    input = JSON.parse((await readStdin()) || '{}')
  } catch {
    return
  }
  const sessionId = input.session_id
  if (!sessionId) return
  const cfg = loadConfig()
  let root
  try {
    root = repoRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd())
  } catch {
    return
  }
  if (!fs.existsSync(runsDir(root, cfg))) return

  const run = listRuns(root, cfg).find((r) => r.session_id === sessionId && !TERMINAL.has(r.status))
  if (!run || !ENFORCED.has(run.status)) return

  const tree = snapshotTree(root)
  const progress = runProgress(run, tree, cfg)
  if (progress.clear) {
    if (run.hook && run.hook.consecutive_blocks) {
      run.hook = { consecutive_blocks: 0 }
      saveRunQuietly(root, cfg, run)
    }
    return
  }

  // Progress = the code changed, or orch.mjs recorded something (state_rev).
  // The hook's own writes deliberately leave state_rev alone.
  const signature = `${tree}:${run.state_rev}`
  const prev = run.hook || {}
  const blocks = prev.signature === signature ? (prev.consecutive_blocks || 0) + 1 : 1

  if (blocks > cfg.hookMaxStalledBlocks) {
    run.resume_to = 'building'
    run.status = 'needs-human'
    run.status_reason = `stalled — the Stop hook blocked ${blocks - 1} times in a row with no change to the code or the run`
    run.hook = { consecutive_blocks: 0 }
    saveRun(root, cfg, run, 'hook-stalled', { tree })
    emit({
      systemMessage: `Orchestrator run ${run.id} stalled (${progress.blockers.join('; ')}). It is now "needs-human" — the session may stop. Say how to proceed, then have Claude run \`resume\`.`,
    })
    return
  }

  run.hook = { signature, consecutive_blocks: blocks, last_block_at: new Date().toISOString() }
  saveRunQuietly(root, cfg, run)
  emit({
    decision: 'block',
    reason: [
      `Orchestrator run ${run.id} ("${run.title}") is building, and its gates are not clear at tree ${tree.slice(0, 8)} — keep working.`,
      'Open:',
      ...progress.blockers.map((b) => `- ${b}`),
      `Next step: ${progress.next}`,
      `Only if you are truly blocked on something the human alone can resolve (a decision, credentials, a backend change): \`${ORCH} escalate "<what you need>"\`, then tell them. Escalating to escape work defeats the pipeline.`,
    ].join('\n'),
  })
}

main().catch((e) => {
  process.stderr.write(
    `[orchestrator stop-hook] ${e && e.message ? e.message : e} — letting the stop through\n`,
  )
  process.exit(0)
})
