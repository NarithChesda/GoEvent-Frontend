/**
 * Working-tree fingerprints.
 *
 * `snapshotTree` hashes the whole working tree — tracked edits, deletions and
 * untracked files, minus anything gitignored — into a git tree object without
 * touching the real index, HEAD or the checkout. The tree id is the
 * fingerprint every gate result is stamped with: a gate is only "passed" for
 * the exact code it ran against, and any later edit makes it stale.
 *
 * Tree objects are also diffable (`git diff <treeA> <treeB>`), which is how a
 * reviewer gets "what changed in this checkpoint" with nothing committed.
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function git(root, args, { env, trim = true } = {}) {
  const out = execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return trim ? out.trim() : out
}

export function repoRoot(cwd = process.cwd()) {
  return git(cwd, ['rev-parse', '--show-toplevel'])
}

export function snapshotTree(root) {
  const index = path.resolve(root, git(root, ['rev-parse', '--git-path', 'index']))
  const tmp = path.join(
    os.tmpdir(),
    `orch-index-${process.pid}-${crypto.randomBytes(4).toString('hex')}`,
  )
  try {
    // Seeding from the real index keeps git's stat cache, so only files that
    // changed are re-hashed — a fresh index would hash the whole repo.
    if (fs.existsSync(index)) fs.copyFileSync(index, tmp)
    const env = { GIT_INDEX_FILE: tmp }
    git(root, ['add', '-A'], { env })
    return git(root, ['write-tree'], { env })
  } finally {
    fs.rmSync(tmp, { force: true })
  }
}

/** Files that differ between two trees, with their status letter (A/M/D/R…). */
export function changedFiles(root, from, to) {
  const out = git(root, ['diff', '--name-status', '--no-renames', from, to])
  if (!out) return []
  return out.split('\n').map((line) => {
    const [status, file] = line.split('\t')
    return { status, file }
  })
}

export function diffPatch(root, from, to, paths = []) {
  return git(root, ['diff', from, to, ...(paths.length ? ['--', ...paths] : [])], { trim: false })
}

export function diffStat(root, from, to) {
  return git(root, ['diff', '--stat', from, to])
}

/** Whether `file` exists in a snapshot tree (e.g. the run's start tree). */
export function treeHasFile(root, tree, file) {
  try {
    git(root, ['cat-file', '-e', `${tree}:${file}`])
    return true
  } catch {
    return false
  }
}

export function fileHash(root, file) {
  const abs = path.resolve(root, file)
  if (!fs.existsSync(abs)) return null
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')
}
