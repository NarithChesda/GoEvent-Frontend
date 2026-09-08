/**
 * The shared custom-icon library.
 *
 * Agenda items used to arrive with their icon's full `svg_code` nested inside
 * them — 20-36KB of SVG per item, and a 13-item schedule referencing nine
 * distinct icons therefore shipped ~262KB, most of it byte-identical repeats.
 * The showcase then fetched the whole library again on the same page load. The
 * payload now carries only `{id, name}`, and the artwork is resolved from here.
 *
 * One fetch per app, deduplicated: an agenda renders many icons at once and the
 * editor's picker wants the same list, so every caller — the five showcase
 * designs, the management card, the icon dropdown — goes through this store and
 * they all await one in-flight request. The response is public, immutable in
 * practice and edge-cached for an hour, so on a warm cache the second page load
 * costs nothing at all.
 *
 * This is the only place `coreDataService.getIcons()` should be called.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { coreDataService } from '../services/api'
import type { AgendaIcon } from '../services/api'

export const useIconLibraryStore = defineStore('iconLibrary', () => {
  const icons = ref<AgendaIcon[]>([])

  /** The fetch succeeded — `icons` is the library and `load()` is a no-op. */
  const loaded = ref(false)

  /**
   * A fetch *finished*, successfully or not. Separate from `loaded` because
   * the two answer different questions: `loaded` decides whether to retry,
   * while this decides whether "no artwork for id 5" means "not yet" or
   * "genuinely absent". Without it a failed load would leave every render site
   * holding an empty icon slot open forever rather than falling back.
   */
  const settled = ref(false)

  let inflight: Promise<void> | null = null

  const byId = computed(() => {
    const map = new Map<number, string>()
    for (const icon of icons.value) {
      if (icon.svg_code) map.set(icon.id, icon.svg_code)
    }
    return map
  })

  /**
   * Fetch the library once. Safe to call from every component that renders an
   * icon — concurrent callers share the in-flight promise, and a completed load
   * returns immediately. A failure leaves `loaded` false, so the next mount
   * retries.
   */
  async function load(): Promise<void> {
    if (loaded.value) return
    if (inflight) return inflight

    inflight = (async () => {
      try {
        const response = await coreDataService.getIcons()
        if (response.success && response.data) {
          icons.value = response.data
          loaded.value = true
        }
      } catch (error) {
        console.error('Failed to load the icon library:', error)
      } finally {
        settled.value = true
        inflight = null
      }
    })()

    return inflight
  }

  /** Raw SVG source for an icon id, or `''` while the library is still loading. */
  function svgFor(id?: number | null): string {
    if (id == null) return ''
    return byId.value.get(id) ?? ''
  }

  /**
   * Whether a render site should draw this icon's slot rather than its
   * fallback glyph.
   *
   * True while the library is still in flight, so an item that has an icon
   * holds its place instead of flashing the fallback and then swapping. Once a
   * fetch has settled it answers honestly, which is also what covers an icon
   * deleted from the library while an agenda item still points at it — the
   * fallback takes over rather than an empty box staying on screen.
   */
  function hasArtwork(id?: number | null): boolean {
    if (id == null) return false
    return !settled.value || byId.value.has(id)
  }

  return { icons, loaded, settled, byId, load, svgFor, hasArtwork }
})
