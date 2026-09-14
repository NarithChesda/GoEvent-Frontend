// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tokenManager, TokenRejectedError, SESSION_EXPIRED_EVENT } from './tokenManager'

/**
 * The session-lifetime rules, which had no test at all before a report of being
 * signed out mid-session on a phone.
 *
 * The backend runs a 60-minute access token against a 24-hour refresh token
 * (see FRONTEND_DEPLOYMENT_GUIDE §JWT), with ROTATE_REFRESH_TOKENS and
 * BLACKLIST_AFTER_ROTATION. Both facts are load-bearing here: the first means a
 * healthy session spends most of its life holding a dead access token, the
 * second means a sibling tab's refresh invalidates the one this tab is holding.
 */

/**
 * A structurally valid JWT — three base64url parts — expiring at `expSeconds`.
 * The `jti` counter keeps two tokens minted in the same second distinct, which
 * the rotation test depends on: real rotation always yields a different string.
 */
let jti = 0
function makeJwt(expSeconds: number): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).split('+').join('-').split('/').join('_').split('=').join('')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ exp: expSeconds, user_id: 1, jti: jti++ })}.sig`
}

const nowSec = () => Math.floor(Date.now() / 1000)
const freshToken = () => makeJwt(nowSec() + 3600)
const expiredToken = () => makeJwt(nowSec() - 60)

describe('tokenManager session lifetime', () => {
  beforeEach(() => {
    localStorage.clear()
    tokenManager.clearValidationCache()
  })

  it('treats an expired access token with a live refresh token as a session', () => {
    tokenManager.setTokens(expiredToken(), freshToken())

    // The regression: this is the state a user is in for 23 of every 24 hours.
    expect(tokenManager.isAuthenticated()).toBe(false)
    expect(tokenManager.hasSession()).toBe(true)
  })

  it('reports no session once the refresh token has expired too', () => {
    tokenManager.setTokens(expiredToken(), expiredToken())

    expect(tokenManager.hasSession()).toBe(false)
  })

  it('still reports a session when only the access token is live', () => {
    tokenManager.setTokens(freshToken(), expiredToken())

    expect(tokenManager.hasSession()).toBe(true)
  })

  it('keeps the tokens when a refresh fails transiently', async () => {
    tokenManager.setTokens(expiredToken(), freshToken())

    const ok = await tokenManager.attemptTokenRefresh(async () => {
      throw new Error('Token refresh failed: 502')
    })

    expect(ok).toBe(false)
    // A bad gateway or a moment without signal must not cost a day of session.
    expect(tokenManager.hasSession()).toBe(true)
    expect(tokenManager.getRefreshToken()).not.toBeNull()
  })

  it('ends the session when the server rejects the refresh token', async () => {
    tokenManager.setTokens(expiredToken(), freshToken())
    const onExpired = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)

    const ok = await tokenManager.attemptTokenRefresh(async () => {
      throw new TokenRejectedError('Token refresh rejected: 401')
    })

    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)

    expect(ok).toBe(false)
    expect(tokenManager.hasSession()).toBe(false)
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('retries with the pair a sibling tab rotated to, instead of ending the session', async () => {
    const original = freshToken()
    const rotated = freshToken()
    tokenManager.setTokens(expiredToken(), original)

    const seen: string[] = []
    const ok = await tokenManager.attemptTokenRefresh(async (refreshToken) => {
      seen.push(refreshToken)
      if (refreshToken === original) {
        // Stand in for the other tab having already rotated and blacklisted it.
        tokenManager.setTokens(freshToken(), rotated)
        throw new TokenRejectedError('Token refresh rejected: 401')
      }
      return { access: freshToken(), refresh: freshToken() }
    })

    expect(ok).toBe(true)
    expect(seen).toEqual([original, rotated])
    expect(tokenManager.hasSession()).toBe(true)
  })

  it('refreshes rather than giving up when the access token is missing entirely', async () => {
    tokenManager.setTokens(freshToken(), freshToken())
    localStorage.removeItem('goevent_v3_access_token')

    const refresh = vi.fn(async () => ({ access: freshToken(), refresh: freshToken() }))
    const valid = await tokenManager.ensureValidToken(async () => true, refresh)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(valid).toBe(true)
  })
})
