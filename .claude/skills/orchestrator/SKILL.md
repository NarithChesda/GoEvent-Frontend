---
name: orchestrator
description: Builds a whole feature in this repo through a gated pipeline (Shopify Helix-style). A planner sub-agent splits the request into ordered checkpoints and HTML prototypes, and the human approves the plan. Each checkpoint is built test-first by a fresh sub-agent and must pass four gates: TDD behavior (unit, e2e, type-check and lint against a baseline), UI (screenshots vs the prototype and DESIGN.md), an adversarial review ⇄ fix loop, and final human review. A Stop hook keeps the session working until every gate is clear. Use it when the user says "orchestrate", "/orchestrator", "use the pipeline", "checkpoints", "Helix", or asks for a multi-part feature built end to end with tests and review. Not for single-file fixes, questions, audits, or anything a direct edit finishes in minutes.
---

# Orchestrator

You are the **orchestrator**. You don't write the feature. You run the pipeline that does.

- **Sub-agents** each work in a fresh context: a planner, builders, reviewers, fixers.
- **Scripts** record what actually happened.
- **A Stop hook** won't let this session end its turn mid-build while any gate is open.
- **The human** is asked twice: once to approve the plan, once to review the result.

```
intake ─► planner ─► [HUMAN approves plan + prototypes]
            │
            ▼  for each checkpoint, simplest first
   start ─► builder: tests ─► gate red ─► code ─► gate behavior
         ─► (UI) gate ui ─► ui-reviewer ⇄ fixer
         ─► adversary ⇄ fixer, until it approves
         ─► complete
            │
            ▼
   gate final ─► review-ready ─► [HUMAN reviews]
                                   ├─► done
                                   └─► feedback ─► new checkpoints + LEARNINGS.md ─► loop
```

All commands are `node .claude/skills/orchestrator/scripts/orch.mjs <command>`, called **ORCH** below, run from the repo root. `ORCH status` always prints the one next step. When in doubt, run it.

## Ground rules

1. **Keep your own context lean.** You read status lines, verdict words and short reports. Sub-agents read the diffs, logs and screenshots, which is why `ORCH brief` writes their inputs to files instead of you pasting them. A long run rots an agent's context; that's the reason each step gets a fresh one.
2. **State is computed, never claimed.** `run.json` is written only by ORCH. Every gate result is stamped with a fingerprint of the working tree it ran against, and any later edit makes it stale. That staleness is the point, so re-run the gate rather than arguing with it. Never hand-edit `run.json` or a verdict's `reviewed_tree`.
3. **Two human touchpoints.** Between plan approval and final review, decide what you can with sensible defaults. `escalate` only for what the human alone can resolve: a product decision, credentials, a backend change, a contested finding after the round limit.
4. **Sub-agents run in the foreground** (`run_in_background: false`). Every next step depends on their result, and a background agent would leave you trying to end your turn mid-build, which the hook refuses.
5. **Nothing commits.** Never `git commit` or `git push`, and don't let a sub-agent. Never `npx playwright install` (it hangs here; `npm run test:e2e:install` is the repair).
6. **Tell the human as you go**: one line per checkpoint started, gate failed or checkpoint passed. They can see your text between tool calls.

### Spawning a sub-agent

```
ORCH brief <role> [cp]                → prints the brief's path
Agent({ subagent_type: "general-purpose", description: "<role> <cp>",
        prompt: "You are the <role> sub-agent of the orchestrator pipeline. Read <brief path> and follow it exactly. Your final reply is all the orchestrator sees — make it the report your role file asks for.",
        run_in_background: false })
```

- **Builders:** if a builder comes back with `gate behavior` still failing, continue *that* agent with `SendMessage` and the log path. Its context is exactly what the fix needs.
- **Reviewers** (ui-reviewer, adversary) are **always new**. A reviewer that saw the last round's reasoning anchors on it.
- **Fixers** are new per round.

## Phase 0 — Intake

1. **Is this big enough?** If it's under two checkpoints of work, say so and offer to just do it. The pipeline costs real time: a baseline of about a minute, a minute or more per gate, and several agents per checkpoint.
2. **Ask only what blocks planning**, with AskUserQuestion. Everything else is the planner's job, or yours to default.
3. Run `ORCH init "<short title>"`. It captures the type-check, lint and unit-test baselines (about a minute) and binds the run to this session.
4. Fill in `<run>/brief.md`: the request **verbatim**, your questions with their answers, and the constraints.

## Phase 1 — Plan (human touchpoint 1)

1. Run `ORCH brief planner`, then spawn the planner.
2. Run `ORCH plan <run>/plan.draft.json`. It validates, imports and prints `plan.md`. If it rejects the plan, send the planner back with the errors.
3. **Present the plan**: the checkpoint table, the out-of-scope list, the risks, and each UI checkpoint's prototype path, so they can open it in a browser. Say plainly that approving means you'll build it all before coming back. Then **stop**; the status is `awaiting-plan-approval`, so the hook lets you.
4. When they answer:
   - On a yes, run `ORCH approve --note "<their words>"`.
   - On changes, send the planner back with their notes, run `ORCH plan …` again, and present it again.

## Phase 2 — Build, one checkpoint at a time

| Step | Command / agent | Moves on when |
|---|---|---|
| 1 | `ORCH start <cp>` | always |
| 2 | **builder**: it writes the tests, runs `gate red`, implements, then runs `gate behavior` | `ORCH status` shows red ok · behavior ok |
| 3 | *(UI checkpoints)* `ORCH gate ui <cp>` → **ui-reviewer** → `ORCH record ui <cp> <verdict>` | UI passed at this tree |
| 3′ | *(UI failed)* **fixer** → `ORCH gate ui <cp>` → new **ui-reviewer** | UI passed |
| 4 | **adversary** → `ORCH record adversary <cp> <verdict>` | round approved at this tree |
| 4′ | *(rejected)* **fixer** → UI again if the checkpoint has UI (the fix made it stale) → new **adversary** | approved |
| 5 | `ORCH complete <cp>` | passed; next checkpoint |

- **Verify, don't trust.** After each agent returns, run `ORCH status`. A builder saying "tests pass" means nothing until the gate row says so.
- **Why the order is behavior → UI → adversary:** each gate is cheapest to fail early, and every fix re-opens the gates after it. That's deliberate: a checkpoint passes only when all of its gates were green *on the same code*.
- **Round limit.** After `adversaryMaxRounds` rejected rounds (4), `record` exits 3. Run `ORCH escalate "<what the adversary and the fixer disagree on>"` and put both positions to the human.
- **The plan turns out wrong mid-build** (a missing backend field, a checkpoint that can't work as written):
  1. `ORCH escalate "<the concrete problem>"`, then explain it to the human.
  2. If they agree to re-plan, the planner writes the replacement for the not-yet-started checkpoints, and you run `ORCH plan <draft> --replace-pending`.
  3. That goes back to the human for approval, like any plan.

## Phase 3 — Final gate (human touchpoint 2)

1. Run `ORCH gate final`. It re-runs the whole unit suite, every checkpoint's e2e specs, the type-check and lint at the final tree, which catches one checkpoint breaking another. If it fails, run `ORCH brief fixer` with no checkpoint, spawn the fixer, and run `gate final` again.
2. Run `ORCH review-ready`. It writes and prints `review.md`: what changed, each checkpoint's review history, the reviewers' minor notes, and anything changed after the last checkpoint passed, which no adversary saw.
3. **Present it** in a short summary: what was built, how to see it (`npm run dev` plus the route), the minor notes, and where the evidence lives. Then **stop**. Nothing is committed; say so.

## Phase 4 — The human's review

- **Accepted:** run `ORCH done`. Offer to commit, and only commit on an explicit yes for that diff.
- **Changes asked:**
  1. Write their notes **verbatim** to a file and run `ORCH feedback <file>`.
  2. Run `ORCH brief planner`; the planner now plans only the new work and proposes learnings.
  3. **Vet the learnings.** Keep a rule for next time ("filters are dropdowns"). Drop a fix for this time ("make the star gold"): it is a checkpoint, not a learning.
  4. Run `ORCH plan <draft> --append`. You're back in Phase 2, with no second approval: the human just told you what to build.

## The Stop hook

It is registered in `.claude/settings.local.json` next to the impeccable hook.

- **It is armed only while this session's run is `building`.** It is silent for other sessions and for every other status: planning, awaiting approval or review, needs-human, paused, done, aborted.
- **While armed**, ending your turn with any gate open is blocked. The hook's message lists what's open and the exact next command. Do that, not something else.
- **To stop legitimately mid-build**, run `ORCH escalate "<what you need>"`, or `ORCH pause "<why>"` when the human asks you to pause. Then `ORCH resume` once they answer. Escalating to escape work defeats the pipeline; the human sees the reason.
- **It can't trap you.** After `hookMaxStalledBlocks` blocks (4) with no change to the code or the run, it marks the run `needs-human` and lets the stop through. On any internal error it fails open.

## When things go wrong

- **A gate fails for infrastructure, not code** (dev-server port, network, Playwright browsers): read the log, fix the environment, and re-run the same gate. Don't send a fixer at infrastructure.
- **`gate red` refuses because non-test files changed:** the builder wrote code first. Continue it and have it move those changes out until red is recorded.
- **`record` refuses with "reviewed X but the code is now Y":** either the reviewer edited files, or code changed after the review. Look at `ORCH diff <cp>`, restore what a reviewer touched, and review again.
- **The session restarted mid-run:** `ORCH list`, then `ORCH use <id>` to rebind it, then `ORCH status`.
- **Commands take a while:**
  - `init`: about 1 minute.
  - `gate behavior` / `final`: about 1 minute, plus e2e.
  - `gate ui`: e2e plus the prototype shots.

  Give Bash a generous timeout (600000 ms).

## Files

| Path | What |
|---|---|
| `scripts/orch.mjs` | CLI: state machine, gates, briefs (`ORCH help`) |
| `scripts/stop-hook.mjs` | the Stop hook |
| `roles/*.md` | planner, builder, ui-reviewer, adversary, fixer: each role's job, limits and output contract |
| `schema/plan.schema.json`, `plan.example.json` | the plan format, with a worked example |
| `LEARNINGS.md` | rules from human reviews; every sub-agent reads it |
| `config.json` | the commands each gate runs, baselines, limits |
| `tests/selftest.mjs` | `node --test .claude/skills/orchestrator/tests/selftest.mjs`: the state machine and hook, end to end, on stub tools |

**Run state** lives in `.claude/orchestrator/runs/<id>/` (gitignored):

- `run.json`
- `brief.md`
- `plan.md`
- `prototypes/`
- `briefs/`
- `evidence/<cp>/`: logs, diffs, screenshots, verdicts
- `review.md`
