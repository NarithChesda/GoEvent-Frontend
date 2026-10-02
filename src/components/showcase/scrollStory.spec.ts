import { describe, expect, it } from 'vitest'
import { resolveStoryTone } from './scrollStory'

describe('resolveStoryTone', () => {
  it('gives birthdays the playful tone', () => {
    expect(resolveStoryTone('Birthday')).toBe('playful')
    expect(resolveStoryTone('birthday party')).toBe('playful')
  })

  it('gives funerals and ceremonies the solemn tone', () => {
    expect(resolveStoryTone('Funeral')).toBe('solemn')
    expect(resolveStoryTone(' FUNERAL SERVICE ')).toBe('solemn')
  })

  it('falls back to elegant for weddings, other categories and no category', () => {
    expect(resolveStoryTone('Wedding')).toBe('elegant')
    expect(resolveStoryTone('Housewarming Party')).toBe('elegant')
    expect(resolveStoryTone('default')).toBe('elegant')
    expect(resolveStoryTone('')).toBe('elegant')
    expect(resolveStoryTone(null)).toBe('elegant')
    expect(resolveStoryTone(undefined)).toBe('elegant')
  })
})
