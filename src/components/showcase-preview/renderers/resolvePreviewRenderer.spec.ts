import { describe, it, expect } from 'vitest'
import {
  resolvePreviewRenderer,
  standardMiddleStageVideo,
  type PreviewFrameContext,
} from './resolvePreviewRenderer'

/**
 * The Event Video frame is the standard flow's middle beat. It used to exist
 * only when the organizer had uploaded an `event_video` of their own, which
 * meant a general-purpose standard template — one sold to many organizers, most
 * of whom never film anything — could never show that beat at all. A template
 * can now ship its own `standard_transition_video` as the fallback, and this is
 * the gate that decides whether the stage is there to look at.
 *
 * Worth pinning down because the failure is quiet in both directions: too
 * narrow and the partner's just-uploaded film has no frame to appear in, too
 * wide and every basic template grows a stage its guests never see.
 */
const context = (overrides: Partial<PreviewFrameContext> = {}): PreviewFrameContext => ({
  event: {},
  templateAssets: null,
  hasFeaturedPhoto: false,
  ...overrides,
})

const eventVideoFrame = () => {
  const frame = resolvePreviewRenderer(context()).frames.find((f) => f.id === 'event_video')
  if (!frame) throw new Error('the V1 renderer no longer declares an event_video frame')
  return frame
}

describe('standardMiddleStageVideo', () => {
  it("prefers the organizer's own film over the template's", () => {
    expect(
      standardMiddleStageVideo(
        context({
          event: { event_video: '/media/events/ours.mp4' },
          templateAssets: { standard_transition_video: '/media/templates/theirs.mp4' },
        }),
      ),
    ).toBe('/media/events/ours.mp4')
  })

  it("falls back to the template's film", () => {
    expect(
      standardMiddleStageVideo(
        context({ templateAssets: { standard_transition_video: '/media/templates/theirs.mp4' } }),
      ),
    ).toBe('/media/templates/theirs.mp4')
  })

  it('resolves to nothing when neither exists', () => {
    expect(standardMiddleStageVideo(context())).toBeNull()
  })
})

describe('the Event Video frame gate', () => {
  const standard = { standard_cover_video: '/media/templates/cover.mp4' }

  it('shows for a standard template whose own transition film is the only video', () => {
    const ctx = context({
      templateAssets: { ...standard, standard_transition_video: '/media/templates/mid.mp4' },
    })
    expect(eventVideoFrame().isVisible?.(ctx)).toBe(true)
  })

  it('shows for a standard template when only the event has a video', () => {
    const ctx = context({
      event: { event_video: '/media/events/ours.mp4' },
      templateAssets: standard,
    })
    expect(eventVideoFrame().isVisible?.(ctx)).toBe(true)
  })

  it('hides — but stays applicable — when a standard template has no video at all', () => {
    const ctx = context({ templateAssets: standard })
    const frame = eventVideoFrame()
    expect(frame.isVisible?.(ctx)).toBe(false)
    // Applicable-but-unused is what earns the "upload a video to add this
    // screen" note; a basic template must get no note, only no frame.
    expect(frame.isApplicable?.(ctx)).toBe(true)
  })

  it('stays hidden on a basic template even with a transition film set', () => {
    const ctx = context({
      templateAssets: { standard_transition_video: '/media/templates/mid.mp4' },
    })
    const frame = eventVideoFrame()
    expect(frame.isVisible?.(ctx)).toBe(false)
    expect(frame.isApplicable?.(ctx)).toBe(false)
  })
})
