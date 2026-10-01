/**
 * Self-test for the orchestrator's state machine, gates and Stop hook.
 *
 *   node --test .claude/skills/orchestrator/tests/selftest.mjs
 *
 * Builds a throwaway git repo whose "vitest", "playwright", "vue-tsc" and
 * "eslint" are tiny stubs that replay whatever report the test writes, then
 * drives a two-checkpoint run end to end through the real CLI and hook. The
 * named file is deliberately not *.test.mjs / *.spec.mjs, so the app's own
 * `vitest` never collects it.
 */
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { globToRegExp } from '../scripts/lib/core.mjs'
import { newCounts, parseTsc } from '../scripts/lib/checks.mjs'

const SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts')
const ORCH = path.join(SCRIPTS, 'orch.mjs')
const HOOK = path.join(SCRIPTS, 'stop-hook.mjs')

const repo = fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()), 'orch-selftest-'))
const fake = path.join(repo, '.fake')
const cfgFile = path.join(fake, 'config.json')

const git = (...args) =>
  execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
const write = (f, s) => {
  fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true })
  fs.writeFileSync(path.join(repo, f), s)
}
const read = (f) => fs.readFileSync(path.join(repo, f), 'utf8')

function orch(args, session = 'sess-A') {
  const r = spawnSync(process.execPath, [ORCH, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, ORCH_CONFIG: cfgFile, CLAUDE_CODE_SESSION_ID: session },
  })
  return { code: r.status, out: `${r.stdout}${r.stderr}` }
}

function hook(session = 'sess-A') {
  const r = spawnSync(process.execPath, [HOOK], {
    cwd: repo,
    encoding: 'utf8',
    input: JSON.stringify({
      session_id: session,
      cwd: repo,
      hook_event_name: 'Stop',
      stop_hook_active: false,
    }),
    env: { ...process.env, ORCH_CONFIG: cfgFile, CLAUDE_PROJECT_DIR: repo },
  })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim() ? JSON.parse(r.stdout) : null
}

const run = () => {
  const dir = path.join(repo, '.orch', 'runs')
  const id = fs.readdirSync(dir)[0]
  return JSON.parse(fs.readFileSync(path.join(dir, id, 'run.json'), 'utf8'))
}
const runDir = () => path.join(repo, '.orch', 'runs', run().id)

/** A vitest-shaped report: [{ file, tests: { name: 'passed'|'failed' }, loadError? }] */
function unitReport(entries) {
  write(
    '.fake/unit.json',
    JSON.stringify({
      testResults: entries.map((e) => {
        const tests = Object.entries(e.tests || {})
        return {
          name: path.join(repo, e.file),
          status: e.loadError || tests.some(([, s]) => s === 'failed') ? 'failed' : 'passed',
          assertionResults: tests.map(([fullName, status]) => ({ fullName, status })),
        }
      }),
    }),
  )
}
const OLD = { file: 'src/old.spec.ts', tests: { 'old passes': 'passed', 'old broken': 'failed' } }
const lintReport = (files) =>
  write(
    '.fake/lint.json',
    JSON.stringify(
      files.map(([f, msgs]) => ({
        filePath: path.join(repo, f),
        messages: msgs.map(([ruleId, message]) => ({ severity: 2, ruleId, message })),
      })),
    ),
  )
const verdict = (name, v) => {
  write(name, JSON.stringify(v))
  return name
}

test.before(() => {
  git('init', '-q')
  git('config', 'user.email', 'selftest@example.com')
  git('config', 'user.name', 'selftest')
  git('config', 'core.autocrlf', 'false')
  write('.gitignore', '.fake/\n.orch/\n')
  write('src/app.ts', 'export const a = 1\n')
  write('e2e/existing.spec.ts', "test('an old spec that may already fail', () => {})\n")
  git('add', '-A')
  git('commit', '-qm', 'base')

  // The full suite (`src`) replays unit.json; a run of named specs replays
  // unit-alone.json when the test has written one (the flake re-run).
  write(
    '.fake/unit.mjs',
    "import fs from 'node:fs'\nconst out = process.argv.at(-1)\nconst alone = new URL('./unit-alone.json', import.meta.url)\nconst full = process.argv.slice(2, -1).join() === 'src'\nfs.copyFileSync(!full && fs.existsSync(alone) ? alone : new URL('./unit.json', import.meta.url), out)\nprocess.exit(JSON.parse(fs.readFileSync(out, 'utf8')).testResults.some((t) => t.status === 'failed') ? 1 : 0)\n",
  )
  write(
    '.fake/e2e.mjs',
    "import fs from 'node:fs'\nimport path from 'node:path'\nconst out = process.argv.at(-1)\nconst code = Number(fs.readFileSync(new URL('./e2e.code', import.meta.url), 'utf8').trim() || 0)\nif (process.env.ORCH_UI_SHOTS && code === 0) {\n  fs.mkdirSync(path.join(out, 'tag-chromium'), { recursive: true })\n  fs.writeFileSync(path.join(out, 'tag-chromium', 'test-finished-1.png'), 'png')\n}\nprocess.exit(code)\n",
  )
  write(
    '.fake/tsc.mjs',
    "import fs from 'node:fs'\nconst t = fs.readFileSync(new URL('./tsc.txt', import.meta.url), 'utf8')\nprocess.stdout.write(t)\nprocess.exit(t.trim() ? 2 : 0)\n",
  )
  write(
    '.fake/lint.mjs',
    "import fs from 'node:fs'\nfs.copyFileSync(new URL('./lint.json', import.meta.url), process.argv.at(-1))\n",
  )
  write('.fake/e2e.code', '0')
  write('.fake/tsc.txt', 'src/app.ts(1,1): error TS1000: old error\n')
  write('.fake/LEARNINGS.md', '# Learnings\n')
  lintReport([['src/app.ts', [['no-x', 'old']]]])
  unitReport([OLD])

  const real = JSON.parse(fs.readFileSync(path.join(SCRIPTS, '..', 'config.json'), 'utf8'))
  write(
    '.fake/config.json',
    JSON.stringify({
      ...real,
      runsDir: '.orch/runs',
      learnings: '.fake/LEARNINGS.md',
      commands: {
        unit: 'node .fake/unit.mjs {files} {out}',
        e2e: 'node .fake/e2e.mjs {files} {out}',
        typecheck: 'node .fake/tsc.mjs',
        lint: 'node .fake/lint.mjs {files} {out}',
        detector: null,
      },
      prototypeShots: false,
      hookMaxStalledBlocks: 2,
    }),
  )
})

test.after(() => fs.rmSync(repo, { recursive: true, force: true }))

test('glob and type-check parsing', () => {
  assert.ok(globToRegExp('**/*.spec.ts').test('src/a/b.spec.ts'))
  assert.ok(globToRegExp('**/*.spec.ts').test('b.spec.ts'))
  assert.ok(globToRegExp('e2e/**').test('e2e/x/y.ts'))
  assert.ok(!globToRegExp('src/*.ts').test('src/a/b.ts'))
  const base = parseTsc(
    'src/a.vue(1,2): error TS2322: bad\n  continuation line\nsrc/a.vue(9,9): error TS2322: bad\n',
    '/r',
  )
  assert.equal(base['src/a.vue|TS2322|bad'], 2)
  // Moving an old error down a line is not a new error; a third copy is.
  assert.deepEqual(newCounts({ 'src/a.vue|TS2322|bad': 2 }, base), [])
  assert.equal(newCounts({ 'src/a.vue|TS2322|bad': 3 }, base).length, 1)
})

test('a run, end to end', async (t) => {
  await t.test('init captures baselines and binds the session', () => {
    const r = orch(['init', 'Guest tags'])
    assert.equal(r.code, 0, r.out)
    const s = run()
    assert.equal(s.status, 'planning')
    assert.equal(s.session_id, 'sess-A')
    assert.deepEqual(s.baseline.unit, ['src/old.spec.ts::old broken'])
    assert.equal(s.baseline.typecheck['src/app.ts|TS1000|old error'], 1)
    assert.equal(s.baseline.lint['src/app.ts']['no-x|old'], 1)
    assert.match(orch(['init', 'Another']).out, /already has live run/)
  })

  await t.test('the hook leaves planning alone', () => {
    assert.equal(hook(), null)
  })

  await t.test('plan validation', () => {
    const cp1 = {
      id: 'cp-01',
      title: 'Tag model',
      intent: 'Tags exist.',
      acceptance: ['a tag has a name'],
      tests: { unit: ['src/tag.spec.ts'], e2e: [] },
      complexity: 1,
    }
    const cp2 = {
      id: 'cp-02',
      title: 'Tag chips',
      intent: 'Tags show.',
      acceptance: ['a guest row shows its tags'],
      depends_on: ['cp-01'],
      tests: { unit: ['src/tag-view.spec.ts'], e2e: ['e2e/tag.spec.ts'] },
      ui: { prototype: 'prototypes/cp-02.html', screens: ['guest list with tags'] },
      complexity: 2,
    }
    const intoOldSpec = { ...cp2, tests: { unit: [], e2e: ['e2e/existing.spec.ts'] } }
    write(
      '.fake/bad.json',
      JSON.stringify({ checkpoints: [{ ...cp1, acceptance: [] }, intoOldSpec] }),
    )
    const bad = orch(['plan', '.fake/bad.json', '--check'])
    assert.equal(bad.code, 1)
    assert.match(bad.out, /acceptance must be a non-empty array/)
    assert.match(bad.out, /prototype "prototypes\/cp-02.html" does not exist/)
    // An existing spec may already fail, which would fake red and block green.
    assert.match(bad.out, /"e2e\/existing\.spec\.ts" already existed when the run started/)

    fs.writeFileSync(
      path.join(runDir(), 'prototypes', 'cp-02.html'),
      '<!doctype html><title>p</title>',
    )
    write(
      '.fake/plan.json',
      JSON.stringify({ summary: 'Tags on guests.', checkpoints: [cp1, cp2] }),
    )
    assert.equal(orch(['plan', '.fake/plan.json', '--check']).code, 0)
    const ok = orch(['plan', '.fake/plan.json'])
    assert.equal(ok.code, 0, ok.out)
    assert.equal(run().status, 'awaiting-plan-approval')
    assert.ok(fs.existsSync(path.join(runDir(), 'plan.md')))
    assert.equal(hook(), null)
  })

  await t.test('approval arms the hook — for this session only', () => {
    assert.equal(orch(['approve', '--note', 'looks good']).code, 0)
    const h = hook()
    assert.equal(h.decision, 'block')
    assert.match(h.reason, /start cp-01/)
    assert.equal(hook('sess-B'), null)
  })

  await t.test('red refuses code before tests, then accepts failing tests', () => {
    assert.equal(orch(['start', 'cp-02']).code, 2)
    assert.equal(orch(['start', 'cp-01']).code, 0)
    write('src/tag.ts', 'export const tag = 1\n')
    write('src/tag.spec.ts', "test('tag', () => {})\n")
    const early = orch(['gate', 'red', 'cp-01'])
    assert.equal(early.code, 1)
    assert.match(early.out, /only tests may change before red.*src\/tag\.ts/)

    fs.rmSync(path.join(repo, 'src/tag.ts'))
    unitReport([{ file: 'src/tag.spec.ts', loadError: true }])
    const red = orch(['gate', 'red', 'cp-01'])
    assert.equal(red.code, 0, red.out)
    assert.ok(run().checkpoints[0].gates.red.ok)
  })

  await t.test('behavior tolerates the baseline, not new failures', () => {
    unitReport([OLD, { file: 'src/tag.spec.ts', loadError: true }])
    assert.equal(orch(['gate', 'behavior', 'cp-01']).code, 1)
    write('src/tag.ts', 'export const tag = 1\n')
    unitReport([OLD, { file: 'src/tag.spec.ts', tests: { tag: 'passed' } }])
    lintReport([
      ['src/tag.ts', []],
      ['src/tag.spec.ts', []],
    ])
    const b = orch(['gate', 'behavior', 'cp-01'])
    assert.equal(b.code, 0, b.out)
  })

  await t.test(
    'an untouched spec that fails in the suite but passes alone is a flake, not a failure',
    () => {
      const passing = [OLD, { file: 'src/tag.spec.ts', tests: { tag: 'passed' } }]
      unitReport([...passing, { file: 'src/other.spec.ts', tests: { timing: 'failed' } }])
      write(
        '.fake/unit-alone.json',
        JSON.stringify({
          testResults: [
            {
              name: path.join(repo, 'src/other.spec.ts'),
              status: 'passed',
              assertionResults: [{ fullName: 'timing', status: 'passed' }],
            },
          ],
        }),
      )
      const flaky = orch(['gate', 'behavior', 'cp-01'])
      assert.equal(flaky.code, 0, flaky.out)
      assert.match(flaky.out, /flaky, not counted: src\/other\.spec\.ts::timing/)

      // It reproduces alone → a real failure.
      write(
        '.fake/unit-alone.json',
        JSON.stringify({
          testResults: [
            {
              name: path.join(repo, 'src/other.spec.ts'),
              status: 'failed',
              assertionResults: [{ fullName: 'timing', status: 'failed' }],
            },
          ],
        }),
      )
      const real = orch(['gate', 'behavior', 'cp-01'])
      assert.equal(real.code, 1)
      assert.match(real.out, /new failure: src\/other\.spec\.ts::timing/)

      fs.rmSync(path.join(fake, 'unit-alone.json'))
      unitReport(passing)
      assert.equal(orch(['gate', 'behavior', 'cp-01']).code, 0)
    },
  )

  await t.test('adversary rounds are pinned to the reviewed tree', () => {
    const tree = orch(['tree']).out.trim()
    const stale = verdict('.fake/adv-stale.json', {
      verdict: 'approve',
      reviewed_tree: '0'.repeat(40),
      findings: [],
    })
    assert.match(
      orch(['record', 'adversary', 'cp-01', stale]).out,
      /reviewed 00000000 but the code is now/,
    )
    const inconsistent = verdict('.fake/adv-bad.json', {
      verdict: 'approve',
      reviewed_tree: tree,
      findings: [{ id: 'A1', severity: 'major', claim: 'x' }],
    })
    assert.match(orch(['record', 'adversary', 'cp-01', inconsistent]).out, /Inconsistent verdict/)

    const r1 = verdict('.fake/adv-r1.json', {
      verdict: 'reject',
      reviewed_tree: tree,
      findings: [{ id: 'A1', severity: 'major', claim: 'empty tag accepted' }],
    })
    assert.equal(orch(['record', 'adversary', 'cp-01', r1]).code, 1)
    assert.match(orch(['complete', 'cp-01']).out, /adversary \(REJECTED at this tree\)/)
    assert.match(orch(['status']).out, /spawn the fixer/)
    assert.match(orch(['brief', 'fixer', 'cp-01']).out, /cp-01-fixer-/)
  })

  await t.test('a fix makes every earlier gate stale', () => {
    write(
      'src/tag.ts',
      'export const tag = (n) => { if (!n) throw new Error("empty"); return n }\n',
    )
    const c = orch(['complete', 'cp-01'])
    assert.equal(c.code, 2)
    assert.match(c.out, /behavior \(missing or stale\)/)
    assert.equal(orch(['gate', 'behavior', 'cp-01']).code, 0)
    const brief = orch(['brief', 'adversary', 'cp-01']).out.trim()
    assert.match(fs.readFileSync(path.join(repo, brief), 'utf8'), /What changed since round 1/)
    const tree = orch(['tree']).out.trim()
    const r2 = verdict('.fake/adv-r2.json', {
      verdict: 'approve',
      reviewed_tree: tree,
      findings: [{ id: 'A2', severity: 'minor', claim: 'name could be clearer' }],
    })
    assert.equal(orch(['record', 'adversary', 'cp-01', r2]).code, 0)
    assert.equal(orch(['complete', 'cp-01']).code, 0)
  })

  await t.test('a new type error fails behavior; the UI gate needs a reviewer verdict', () => {
    assert.equal(orch(['start', 'cp-02']).code, 0)
    write('src/tag-view.spec.ts', "test('view', () => {})\n")
    write('e2e/tag.spec.ts', "test('e2e', () => {})\n")
    unitReport([{ file: 'src/tag-view.spec.ts', tests: { view: 'failed' } }])
    write('.fake/e2e.code', '1')
    assert.equal(orch(['gate', 'red', 'cp-02']).code, 0)

    write('src/tag-view.vue', '<template><span>tag</span></template>\n')
    unitReport([
      OLD,
      { file: 'src/tag.spec.ts', tests: { tag: 'passed' } },
      { file: 'src/tag-view.spec.ts', tests: { view: 'passed' } },
    ])
    write('.fake/e2e.code', '0')
    write(
      '.fake/tsc.txt',
      'src/app.ts(1,1): error TS1000: old error\nsrc/tag-view.vue(1,1): error TS2322: new error\n',
    )
    const b1 = orch(['gate', 'behavior', 'cp-02'])
    assert.equal(b1.code, 1)
    assert.match(b1.out, /1 new error/)
    write('.fake/tsc.txt', 'src/app.ts(3,1): error TS1000: old error\n')
    assert.equal(orch(['gate', 'behavior', 'cp-02']).code, 0)

    const ui = orch(['gate', 'ui', 'cp-02'])
    assert.equal(ui.code, 0, ui.out)
    const tree = orch(['tree']).out.trim()
    const fail = verdict('.fake/ui-1.json', {
      verdict: 'fail',
      reviewed_tree: tree,
      findings: [
        {
          id: 'U1',
          severity: 'major',
          screen: 'guest list',
          expected: 'chips',
          actual: 'plain text',
        },
      ],
    })
    assert.equal(orch(['record', 'ui', 'cp-02', fail]).code, 1)
    assert.match(orch(['status']).out, /fixer on the UI findings/)

    write('src/tag-view.vue', '<template><span class="chip">tag</span></template>\n')
    assert.equal(orch(['gate', 'behavior', 'cp-02']).code, 0)
    assert.equal(orch(['gate', 'ui', 'cp-02']).code, 0)
    const t2 = orch(['tree']).out.trim()
    assert.equal(
      orch([
        'record',
        'ui',
        'cp-02',
        verdict('.fake/ui-2.json', { verdict: 'pass', reviewed_tree: t2, findings: [] }),
      ]).code,
      0,
    )
    assert.equal(
      orch([
        'record',
        'adversary',
        'cp-02',
        verdict('.fake/adv-c2.json', { verdict: 'approve', reviewed_tree: t2, findings: [] }),
      ]).code,
      0,
    )
    assert.equal(orch(['complete', 'cp-02']).code, 0)
  })

  await t.test('the final gate is the last thing the hook waits for', () => {
    assert.match(hook().reason, /final gate missing or stale/)
    assert.match(orch(['review-ready']).out, /Not clear/)

    // A regression only visible across checkpoints: the final fixer's path.
    unitReport([
      OLD,
      { file: 'src/tag.spec.ts', tests: { tag: 'failed' } },
      { file: 'src/tag-view.spec.ts', tests: { view: 'passed' } },
    ])
    assert.equal(orch(['gate', 'final']).code, 1)
    assert.match(hook().reason, /final gate FAILING/)
    const fixerBrief = orch(['brief', 'fixer'])
    assert.equal(fixerBrief.code, 0, fixerBrief.out)
    assert.match(
      fs.readFileSync(path.join(repo, fixerBrief.out.trim()), 'utf8'),
      /The final gate failed[\s\S]*FAIL unit/,
    )
    write(
      'src/tag.ts',
      'export const tag = (n) => { if (!n) throw new Error("empty"); return n.trim() }\n',
    )
    unitReport([
      OLD,
      { file: 'src/tag.spec.ts', tests: { tag: 'passed' } },
      { file: 'src/tag-view.spec.ts', tests: { view: 'passed' } },
    ])

    const f = orch(['gate', 'final'])
    assert.equal(f.code, 0, f.out)
    assert.equal(hook(), null)
    const rr = orch(['review-ready'])
    assert.equal(rr.code, 0, rr.out)
    assert.match(rr.out, /name could be clearer/)
    assert.match(rr.out, /not adversarially reviewed[\s\S]*src\/tag\.ts/)
    assert.equal(run().status, 'awaiting-final-review')
  })

  await t.test('feedback becomes new checkpoints and learnings', () => {
    write('.fake/notes.md', 'Use the dropdown filter, not chips.\n')
    assert.equal(orch(['feedback', '.fake/notes.md']).code, 0)
    assert.equal(run().status, 'planning')
    assert.match(
      fs.readFileSync(path.join(repo, orch(['brief', 'planner']).out.trim()), 'utf8'),
      /FEEDBACK round.*[\s\S]*cp-03/,
    )
    const cp3 = {
      id: 'cp-03',
      title: 'Dropdown filter',
      intent: 'Filter by tag.',
      acceptance: ['filter is a dropdown'],
      tests: { unit: ['src/filter.spec.ts'], e2e: [] },
    }
    write(
      '.fake/plan-2.json',
      JSON.stringify({
        checkpoints: [cp3],
        learnings: [
          {
            rule: 'List filters are dropdowns, never chip rows.',
            why: 'The human rejected chips twice.',
          },
        ],
      }),
    )
    const p = orch(['plan', '.fake/plan-2.json', '--append'])
    assert.equal(p.code, 0, p.out)
    assert.equal(run().status, 'building')
    assert.match(
      read('.fake/LEARNINGS.md'),
      /### List filters are dropdowns[\s\S]*feedback round 1/,
    )
  })

  await t.test('a wrong plan is re-planned mid-build and goes back for approval', () => {
    assert.equal(orch(['escalate', 'cp-03 assumes a backend field that does not exist']).code, 0)
    assert.equal(hook(), null)
    const cp3 = {
      id: 'cp-03',
      title: 'Dropdown filter, client-side',
      intent: 'Filter by tag without a backend change.',
      acceptance: ['filters locally'],
      tests: { unit: ['src/filter.spec.ts'], e2e: [] },
    }
    write('.fake/plan-3.json', JSON.stringify({ checkpoints: [cp3] }))
    const p = orch(['plan', '.fake/plan-3.json', '--replace-pending'])
    assert.equal(p.code, 0, p.out)
    assert.equal(run().status, 'awaiting-plan-approval')
    assert.deepEqual(
      run().checkpoints.map((c) => `${c.id}:${c.status}`),
      ['cp-01:passed', 'cp-02:passed', 'cp-03:pending'],
    )
    assert.equal(run().checkpoints[2].title, 'Dropdown filter, client-side')
    assert.match(orch(['approve']).out, /start cp-03/)
  })

  await t.test('a stalled session is released to the human, not trapped', () => {
    assert.equal(hook().decision, 'block')
    assert.equal(hook().decision, 'block')
    const released = hook()
    assert.match(released.systemMessage, /stalled/)
    assert.equal(run().status, 'needs-human')
    assert.equal(hook(), null)
    assert.equal(orch(['resume']).code, 0)
    assert.equal(hook().decision, 'block')
  })

  await t.test('abort ends it', () => {
    assert.equal(orch(['abort', 'no longer needed']).code, 0)
    assert.equal(hook(), null)
  })
})
