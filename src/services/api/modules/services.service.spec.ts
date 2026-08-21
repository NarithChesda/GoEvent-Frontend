import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Response shapes this module is responsible for normalising.
 *
 * `submit-for-review` answers `{ message, listing }` while its signature
 * promises a `ServiceListing`. Callers believed the signature and wrote the
 * wrapper straight into their state, which blanked the listing card on screen —
 * it had no title, no status and no cover image on it. The unwrapping belongs
 * here, where the shape is known, rather than in each caller.
 */

const post = vi.fn()

vi.mock('@/services/api/core/ApiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getPublic: vi.fn(),
    uploadFile: vi.fn(),
    bulkUploadFiles: vi.fn(),
    getProfilePictureUrl: (u: string) => u,
  },
}))

import { serviceListingsService } from './services.service'

const LISTING = {
  id: 'b2c3d4e5-6789-01bc-def2-3456789012cd',
  title: 'Wedding Photography Package',
  status: 'pending_review',
  cover_image_url: '/media/x.webp',
}

beforeEach(() => {
  post.mockReset()
})

describe('serviceListingsService.submitForReview', () => {
  it('unwraps the listing out of the { message, listing } envelope', async () => {
    post.mockResolvedValue({
      success: true,
      data: { message: 'Listing submitted for review', listing: LISTING },
    })

    const response = await serviceListingsService.submitForReview(LISTING.id)

    expect(response.success).toBe(true)
    expect(response.data).toEqual(LISTING)
    // The thing that broke the card: the envelope must not reach the caller.
    expect(response.data).not.toHaveProperty('message')
    expect(response.data?.title).toBe('Wedding Photography Package')
    expect(response.data?.status).toBe('pending_review')
  })

  it('passes a flat listing through untouched', async () => {
    post.mockResolvedValue({ success: true, data: LISTING })

    const response = await serviceListingsService.submitForReview(LISTING.id)

    expect(response.data).toEqual(LISTING)
  })

  it('leaves a failure alone', async () => {
    post.mockResolvedValue({ success: false, message: 'Must have at least one image' })

    const response = await serviceListingsService.submitForReview(LISTING.id)

    expect(response.success).toBe(false)
    expect(response.message).toBe('Must have at least one image')
  })
})
