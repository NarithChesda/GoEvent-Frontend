<template>
  <div class="showcase-studio" :style="{ '--panel-left': panelLeft }">
    <!-- Content panel: a true extension of EventNavigationTabs.vue's own
         fixed icon sidebar — same top/height/glass background, docked right
         at its trailing edge with zero gap, sliding out in place (not a
         floating card). Becomes a full-screen overlay below the app
         sidebar's own `lg` breakpoint — see the max-width: 1023px block in
         <style>. -->
    <div
      v-if="canEdit"
      class="showcase-studio__panel-shell"
      :class="{ 'is-open': panelMode === 'content' }"
    >
      <div class="showcase-studio__panel-inner">
        <div class="showcase-studio__panel-header">
          <span>{{ t('management.showcasePreview.panelContent') }}</span>
          <button
            v-if="canViewLivePreview"
            type="button"
            class="showcase-studio__panel-close"
            :aria-label="t('management.showcasePreview.panelContent')"
            @click="togglePanel"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="showcase-studio__panel-body">
          <!-- EventMediaTab reused wholesale — its own 10 section cards are
               coordinated into a single-open accordion (see
               useAccordionGroup.ts). -->
          <EventMediaTab
            v-if="panelMode === 'content'"
            :event-id="eventId"
            :can-edit="canEdit"
            :initial-media="eventData?.photos || []"
            :event-data="eventData"
            :show-category-specific-sections="showCategorySpecificSections"
            @media-updated="onMediaUpdated"
            @event-updated="onEditorSaved"
          />
        </div>
      </div>
    </div>

    <button
      v-if="canEdit"
      type="button"
      class="showcase-studio__panel-toggle"
      :class="{ 'is-open': panelMode === 'content' }"
      :aria-expanded="panelMode === 'content'"
      :aria-label="t('management.showcasePreview.panelContent')"
      @click="togglePanel"
    >
      <ChevronLeft v-if="panelMode === 'content'" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>

    <div
      v-if="canEdit && panelMode === 'content'"
      class="showcase-studio__panel-backdrop"
      @click="togglePanel"
    />

    <div class="showcase-studio__main" :class="{ 'is-shrunk': panelMode === 'content' }">
      <div class="showcase-preview-tab__header">
        <div>
          <h2 class="showcase-preview-tab__title">{{ t('management.showcasePreview.title') }}</h2>
          <p class="showcase-preview-tab__subtitle">{{ t('management.showcasePreview.subtitle') }}</p>
        </div>

        <div class="showcase-preview-tab__header-actions">
          <!-- Layout switch: single-frame focus vs. every visible frame side
               by side (2 or 3, however many this event actually has). Lives
               in the header row (rather than its own toolbar row below) to
               save vertical space. -->
          <div
            v-if="canViewLivePreview && visibleFrames.length > 1"
            class="showcase-preview-tab__layout-switch"
            role="group"
            :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
          >
            <button
              v-for="opt in VIEW_MODE_OPTIONS"
              :key="opt.value"
              type="button"
              class="showcase-preview-tab__layout-btn"
              :class="{ 'is-active': viewMode === opt.value }"
              :title="t(opt.labelKey)"
              :aria-label="t(opt.labelKey)"
              @click="viewMode = opt.value"
            >
              <component :is="opt.icon" class="w-4 h-4" />
            </button>
          </div>

          <!-- Templates: the same browse-templates modal used elsewhere, wired
               to broadcast a live non-destructive preview into the frames
               while browsing (see BrowseTemplateModal.vue's
               preview-stage/preview-clear emits) — Apply persists for real via
               its own existing confirm flow.

                -->

          <button
        v-if="canEdit"
        @click="showTemplatesModal = true"
        class="flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 items-center text-sm sm:text-base"
      >
        <Palette class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span>{{ t('management.templatePaymentTab.browseBtn.browse') }}</span>
        <span class="hidden sm:inline ml-1">{{ t('management.templatePaymentTab.browseBtn.templates') }}</span>
      </button>
        </div>
      </div>

      <div v-if="loading" class="showcase-preview-tab__loading">
        <div class="showcase-preview-tab__spinner" />
        <span>{{ t('management.media.loading') }}</span>
      </div>

      <div v-else-if="error" class="showcase-preview-tab__error">{{ error }}</div>

      <div v-else-if="event?.id && canViewLivePreview" class="showcase-preview-tab__viewer">
        <!-- The frame list comes from the resolved preview renderer (V1's
             cover/transition/main today — a V2 renderer will declare its own
             pages). Editable frames are interactive when the user can edit:
             clicks go into the frame for click-to-edit text and edit-intent
             regions, while the frame page itself neutralizes live
             buttons/links (RSVP, envelope, music…). -->
        <div
          :ref="setFramesContainerRef"
          class="showcase-preview-tab__frames"
          :class="framesLayoutClass"
        >
          <template v-for="frame in renderer.frames" :key="frame.id">
            <PreviewFrame
              v-if="isFrameVisible(frame)"
              v-show="viewMode === 'single' ? activeFrameId === frame.id : true"
              :ref="(el) => setPreviewFrameRef(frame.id, el)"
              :label="t(frame.labelKey)"
              :fit-height="viewMode === 'single' || !isNarrowViewport"
              :width-override="viewMode === 'multiple' ? sharedColumnWidth : undefined"
            >
              <!-- Left-side floating controls, anchored to whichever frame is
                   currently on screen (in single mode: the active tab, so
                   the picker below stays reachable no matter which frame
                   you're viewing; in multiple mode: always the cover frame,
                   the leftmost one, since every frame is visible already and
                   there's nothing to pick between). Saves the vertical space
                   a separate toolbar row above the frames used to take. -->
              <template v-if="isLeadingFrame(frame)" #leading>
                <div class="showcase-preview-tab__frame-side-controls">
                  <!-- Language switch: cycles through the available languages
                       the preview frames render in. -->
                  <button
                    v-if="availableLanguages.length > 1"
                    type="button"
                    class="showcase-preview-tab__lang-toggle"
                    :title="t('management.showcasePreview.switchLanguage')"
                    :aria-label="t('management.showcasePreview.switchLanguage')"
                    @click="cycleLanguage"
                  >
                    <Languages class="w-3.5 h-3.5" />
                    <span>{{ currentLanguage.toUpperCase() }}</span>
                  </button>

                  <!-- Frame picker: only meaningful in single-frame focus
                       mode, where the other frames are hidden and need some
                       way to switch to — a minimal progress-dot timeline
                       instead of a boxed tab list. -->
                  <div
                    v-if="viewMode === 'single' && visibleFrames.length > 1"
                    class="showcase-preview-tab__frame-timeline"
                    role="group"
                    :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
                  >
                    <button
                      v-for="(pickerFrame, index) in visibleFrames"
                      :key="pickerFrame.id"
                      type="button"
                      class="showcase-preview-tab__frame-step"
                      :class="{ 'is-active': activeFrameId === pickerFrame.id }"
                      @click="activeFrameId = pickerFrame.id"
                    >
                      <span class="showcase-preview-tab__frame-step-track">
                        <span class="showcase-preview-tab__frame-step-dot" />
                        <span
                          v-if="index < visibleFrames.length - 1"
                          class="showcase-preview-tab__frame-step-line"
                        />
                      </span>
                      <span class="showcase-preview-tab__frame-step-label">{{ t(pickerFrame.labelKey) }}</span>
                    </button>
                  </div>
                </div>
              </template>
              <InertIframe
                :ref="(el) => setFrameRef(frame.id, el)"
                :src="frameUrl(frame)"
                :interactive="frame.editable && canEdit"
                :click-message="frame.clickMessage"
              />
            </PreviewFrame>
            <!-- Multiple mode: skip entirely rather than rendering this note —
                 it's a direct sibling of the PreviewFrames inside the grid, so
                 it would occupy its own grid cell and push the next real frame
                 into a wrapped second row (exactly the scroll-required bug this
                 view exists to avoid). Grid columns are already sized off
                 visibleFrames (which excludes this frame), so the remaining
                 frames simply sit side by side with nothing in between. -->
            <div
              v-else-if="viewMode === 'single' && shouldShowHiddenNote(frame)"
              class="showcase-preview-tab__transition-note"
            >
              {{ t(frame.hiddenNoteKey!) }}
            </div>
          </template>
        </div>
      </div>

      <p v-else-if="event?.id" class="showcase-preview-tab__no-preview">
        {{ t('management.showcasePreview.noLivePreview') }}
      </p>
    </div>

    <!-- Parent-side editors for edit intents posted by the frames (logo
         replace, gmap embed, host image, photo uploads) — full-size here in
         the manage page, reusing the forms tab's own components. -->
    <PreviewEditorHost
      v-if="canEdit && event?.id"
      :event-id="eventId"
      :event-data="eventData"
      @saved="onEditorSaved"
    />

    <BrowseTemplateModal
      v-if="canEdit"
      :is-open="showTemplatesModal"
      :event-id="eventId"
      :event-category="eventData?.category ?? undefined"
      @close="showTemplatesModal = false"
      @template-selected="handleTemplateAppliedFromModal"
      @preview-stage="handleTemplateStaged"
      @preview-clear="handleTemplateStageCleared"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick, watch, inject, type Ref } from 'vue'
import { Smartphone, LayoutGrid, ChevronLeft, ChevronRight, Palette, Languages, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useEventShowcase, type TemplateAssets } from '@/composables/useEventShowcase'
import type { Event, EventPhoto, EventTemplate } from '@/services/api'
import PreviewFrame from './PreviewFrame.vue'
import InertIframe from './InertIframe.vue'
import PreviewEditorHost from './editors/PreviewEditorHost.vue'
import BrowseTemplateModal from '../BrowseTemplateModal.vue'
import EventMediaTab from '../EventMediaTab.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from './renderers/resolvePreviewRenderer'

interface Props {
  eventId: string
  canEdit: boolean
  /** The manage page's event record, for the parent-side editors. */
  eventData?: Event
  /** Whether this event's category actually renders the V1
   *  cover/transition/main-content pipeline the live preview frames reuse
   *  (wedding/birthday/housewarming/funeral). Non-showcase categories (e.g.
   *  Conference) still get the Content panel/Templates modal — just no
   *  frames. */
  canViewLivePreview: boolean
  /** Passed straight through to the Content panel's EventMediaTab —
   *  controls visibility of category-specific sections (dress code, etc). */
  showCategorySpecificSections?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** A preview editor changed event-level data — lets EventManageView keep
   *  its copy (and the other tabs) fresh, same contract as EventMediaTab. */
  'event-updated': [event: Event]
  /** Pass-through of EventMediaTab's own media-updated (photo reorder/delete
   *  outside the full event payload). */
  'media-updated': [media: EventPhoto[]]
  /** A template was applied for real via the Templates modal — carries the
   *  same EventTemplate payload BrowseTemplateModal's own template-selected
   *  emits; EventManageView merges it with the same handler it already uses
   *  for the template-payment tab's own BrowseTemplateModal usage. */
  'template-applied': [template: EventTemplate]
}>()

const { t } = useAppLanguage()

// Only used here to resolve the renderer/frame visibility and drive the
// language switcher/loading/error chrome — the actual stage rendering happens
// inside each <iframe>'s own ShowcasePreviewFrameView instance (each with a
// genuine mobile-viewport browsing context, since the showcase components
// rely on real vh/vw units that a plain scaled-down div can't satisfy).
const {
  loading,
  error,
  event,
  templateAssets,
  eventPhotos,
  availableLanguages,
  currentLanguage,
  loadShowcase,
  refreshShowcaseData,
} = useEventShowcase({ eventId: props.eventId, skipMetaTags: true })

const rendererContext = computed(() => ({
  event: event.value,
  templateAssets: templateAssets.value,
  hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
  canEdit: props.canEdit,
}))

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const isFrameVisible = (frame: PreviewFrameDescriptor) =>
  frame.isVisible ? frame.isVisible(rendererContext.value) : true

const visibleFrames = computed(() => renderer.value.frames.filter(isFrameVisible))

// Gates the hidden-frame note separately from isFrameVisible: a frame can be
// hidden either because the template never had this stage at all (no note —
// nothing to explain) or because it's applicable but transiently unused
// (e.g. basic wedding with no featured photo yet — show the note).
const shouldShowHiddenNote = (frame: PreviewFrameDescriptor) =>
  !!frame.hiddenNoteKey &&
  (frame.isApplicable ? frame.isApplicable(rendererContext.value) : true)

// Language switch: a single button (see the leading-slot controls in the
// template) that steps through availableLanguages in order, wrapping around.
const cycleLanguage = () => {
  const langs = availableLanguages.value
  if (langs.length < 2) return
  const currentIndex = langs.findIndex((lang) => lang.language === currentLanguage.value)
  const nextIndex = (currentIndex + 1) % langs.length
  currentLanguage.value = langs[nextIndex].language
}

// ---------------------------------------------------------------------------
// Content panel positioning: the panel is a true extension of
// EventNavigationTabs.vue's own fixed icon sidebar (same left edge, right at
// its trailing 88px-wide rail), so it needs the exact same
// home-sidebar-overlay offset that component computes for itself, or the two
// would drift apart whenever that overlay is shown/collapsed.
// ---------------------------------------------------------------------------
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay', ref(false))
const isCollapsed = inject<Ref<boolean>>('isCollapsed', ref(false))
const isHomeSidebarVisible = computed(() => showHomeSidebarOverlay?.value ?? false)
const sidebarLeftPosition = computed(() => {
  if (!isHomeSidebarVisible.value) return '0px'
  const homeSidebarWidth = isCollapsed?.value ? 96 : 256
  return `${homeSidebarWidth}px`
})
// EventNavigationTabs.vue's own icon rail is a fixed 88px wide (`w-[88px]`).
const panelLeft = computed(() => `calc(${sidebarLeftPosition.value} + 88px)`)

// ---------------------------------------------------------------------------
// Content panel: defaults closed when there's a live preview to show; when
// there isn't one for this event's category, the panel is always open —
// there's nothing else to fall back to.
// ---------------------------------------------------------------------------
const panelMode = ref<'content' | null>(props.canViewLivePreview ? null : 'content')

const togglePanel = () => {
  if (panelMode.value === 'content') {
    panelMode.value = props.canViewLivePreview ? null : 'content'
    return
  }
  panelMode.value = 'content'
}

// Templates: opens the shared BrowseTemplateModal (see template for wiring).
const showTemplatesModal = ref(false)

// ---------------------------------------------------------------------------
// View mode: every visible frame (2 or 3, whatever this event actually has —
// never a fixed count) laid out side by side (default) vs. single-frame focus,
// which needs a picker to choose which frame is showing since the others are
// hidden.
// ---------------------------------------------------------------------------
const VIEW_MODE_OPTIONS = [
  { value: 'single' as const, icon: Smartphone, labelKey: 'management.showcasePreview.layoutSingle' },
  { value: 'multiple' as const, icon: LayoutGrid, labelKey: 'management.showcasePreview.layoutMultiple' },
]

const viewMode = ref<'single' | 'multiple'>('multiple')
const activeFrameId = ref<string>('cover')

watch(
  visibleFrames,
  (frames) => {
    if (!frames.length) return
    if (!frames.some((f) => f.id === activeFrameId.value)) activeFrameId.value = frames[0].id
  },
  { immediate: true },
)

// Which frame currently hosts the left-side floating controls (language
// toggle + frame picker — see template): in single mode that's always the
// one on screen, so the picker stays reachable no matter which tab is
// active; in multiple mode every frame is visible at once (no picker to
// show), so it just anchors to the leftmost one, cover.
const isLeadingFrame = (frame: PreviewFrameDescriptor) =>
  viewMode.value === 'single' ? activeFrameId.value === frame.id : frame.id === 'cover'

const framesLayoutClass = computed(() =>
  viewMode.value === 'multiple' ? `showcase-preview-tab__frames--cols-${visibleFrames.value.length}` : '',
)

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>

const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// Re-fit every mounted frame after a layout change — switching view modes
// (or which frame is focused) changes each frame's available width/height,
// which PreviewFrame can't detect on its own.
const remeasurePreviewFrames = () => {
  nextTick(() => {
    for (const inst of previewFrameRefs.values()) inst.measure()
  })
}

watch(viewMode, remeasurePreviewFrames)
watch(activeFrameId, remeasurePreviewFrames)
// The panel opening/closing changes the frames column's available width too
// (push layout on desktop), so remeasure once the width transition settles.
watch(panelMode, () => setTimeout(remeasurePreviewFrames, 320))

// ---------------------------------------------------------------------------
// Shared column width for "multiple" mode: each PreviewFrame used to
// self-measure its own DOM parent via its own ResizeObserver, and those N
// independent observers could settle at slightly different widths depending
// on timing (worst case, one frame mid-layout reads a stale/tiny value and
// gets stuck there) — so frames in the same row ended up visibly different
// sizes. Measuring the shared frames container once here and handing every
// frame the same computed column width keeps them pixel-identical. The
// column count always matches how many frames there are (2 or 3), so the
// grid never wraps to a second row.
// ---------------------------------------------------------------------------
const FRAMES_GRID_GAP_PX = 24 // matches the `gap: 1.5rem` on --cols-2/--cols-3

const framesContainerWidth = ref(0)
let framesResizeObserver: ResizeObserver | null = null

const setFramesContainerRef = (el: unknown) => {
  framesResizeObserver?.disconnect()
  framesResizeObserver = null
  const element = el as HTMLElement | null
  if (!element) return
  framesContainerWidth.value = element.clientWidth
  framesResizeObserver = new ResizeObserver(() => {
    framesContainerWidth.value = element.clientWidth
  })
  framesResizeObserver.observe(element)
}

// Below this width the `--cols-2`/`--cols-3` CSS falls back to stacking
// full-width (not enough room for real phone-sized frames side by side —
// see the `max-width: 768px` rule below); the column-width override must
// stand down there too, or it'd still hand each frame a divided width while
// CSS gives it the whole row. (Separate from the panel's own lg breakpoint —
// see the max-width: 1023px block in <style>.)
const NARROW_VIEWPORT_PX = 768
const isNarrowViewport = ref(typeof window !== 'undefined' ? window.innerWidth <= NARROW_VIEWPORT_PX : false)
const updateIsNarrowViewport = () => {
  isNarrowViewport.value = window.innerWidth <= NARROW_VIEWPORT_PX
}

const sharedColumnWidth = computed(() => {
  if (viewMode.value !== 'multiple' || isNarrowViewport.value) return undefined
  const cols = Math.max(visibleFrames.value.length, 1)
  return Math.max((framesContainerWidth.value - FRAMES_GRID_GAP_PX * (cols - 1)) / cols, 0)
})

const frameUrl = (frame: PreviewFrameDescriptor) => {
  const params = new URLSearchParams({ stage: frame.id, lang: currentLanguage.value })
  if (props.canEdit && frame.editable) params.set('editable', '1')
  // Always pass the selected template id when one exists — `event_template_enabled`
  // isn't a reliable predictor of whether the showcase endpoint will actually
  // include template_assets (it can be true with no confirmed Payment row yet),
  // so let the frame's own check of the real showcase response decide whether
  // the public-assets fallback is needed instead of gating it here.
  if (props.eventData?.event_template) {
    params.set('templateId', String(props.eventData.event_template))
  }
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Frame refs + post-save refresh: when a parent-side editor saves, every
// frame refetches its showcase data (bridge `refresh`), this tab refreshes
// its own copy (frame visibility, languages), and event-level updates
// propagate up to EventManageView.
// ---------------------------------------------------------------------------
type InertIframeInstance = InstanceType<typeof InertIframe>

const frameRefs = new Map<string, InertIframeInstance>()

const setFrameRef = (id: string, el: unknown) => {
  if (el) frameRefs.set(id, el as InertIframeInstance)
  else frameRefs.delete(id)
}

// ---------------------------------------------------------------------------
// Template live try-on: staging a template broadcasts its assets into every
// mounted frame without touching the backend; any content save (below)
// re-broadcasts the current staged template afterward, since a `refresh`
// bridge message re-fetches real data and would otherwise silently cancel
// an in-progress preview.
// ---------------------------------------------------------------------------
const stagedTemplateData = ref<TemplateAssets | null>(null)

const handleTemplateStaged = (templateData: TemplateAssets) => {
  stagedTemplateData.value = templateData
  for (const frame of frameRefs.values()) frame.postTemplatePreview(templateData)
}

const handleTemplateStageCleared = () => {
  stagedTemplateData.value = null
  for (const frame of frameRefs.values()) frame.post('refresh')
}

const handleTemplateAppliedFromModal = (template: EventTemplate) => {
  showTemplatesModal.value = false
  handleTemplateStageCleared()
  emit('template-applied', template)
}

const onMediaUpdated = (media: EventPhoto[]) => {
  emit('media-updated', media)
  onEditorSaved()
}

const onEditorSaved = (updated?: Event) => {
  for (const frame of frameRefs.values()) frame.post('refresh')
  if (stagedTemplateData.value) {
    for (const frame of frameRefs.values()) frame.postTemplatePreview(stagedTemplateData.value)
  }
  // Silent refresh: this tab's `loading` flag gates the whole frames block,
  // so a full loadShowcase() here would unmount and reload every iframe —
  // exactly the "page refresh" jank the silent path exists to avoid.
  refreshShowcaseData()
  if (updated) emit('event-updated', updated)
}

onMounted(() => {
  loadShowcase()
  window.addEventListener('resize', updateIsNarrowViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsNarrowViewport)
})
</script>

<style scoped>
.showcase-studio {
  position: relative;
}

/* Content panel: a true extension of EventNavigationTabs.vue's own fixed
   icon sidebar — identical top/height/glass background, docked flush at its
   trailing edge (--panel-left, computed in script to match that sidebar's
   own home-sidebar-overlay offset + its 88px rail width) with zero gap, no
   card rounding/shadow. Slides out in place via transform, not a width
   animation, since it's fixed (out of document flow either way). */
.showcase-studio__panel-shell {
  position: fixed;
  top: 4rem;
  left: var(--panel-left);
  width: 320px;
  height: calc(100vh - 4rem);
  z-index: 45;
  overflow: hidden;
  /* Closed: shift by both its own width AND --panel-left so the panel's
     right edge lands at true x:0 (fully behind the sidebar), not just at
     panel-left (the sidebar's own far edge) — translateX(-100%) alone only
     shifts by the panel's own width, leaving its trailing edge (including
     the header's close button) sitting exactly on the sidebar and painting
     over its icons since this panel's z-index is higher. */
  transform: translateX(calc(-100% - var(--panel-left)));
  transition: transform 0.3s ease;
  border-right: 1px solid rgba(148, 163, 184, 0.3);
  background: linear-gradient(
    180deg,
    rgba(248, 255, 254, 0.92) 0%,
    rgba(240, 253, 249, 0.92) 50%,
    rgba(240, 249, 255, 0.92) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.showcase-studio__panel-shell.is-open {
  transform: translateX(0);
}

.showcase-studio__panel-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.showcase-studio__panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.showcase-studio__panel-close {
  padding: 0.375rem;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
}

.showcase-studio__panel-close:hover {
  background: rgba(148, 163, 184, 0.12);
  color: rgb(51 65 85);
}

.showcase-studio__panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
}

/* Toggle: a slim chevron handle riding right at the panel's trailing edge,
   tracking it via the same --panel-left + an is-open offset. Fixed at
   roughly viewport mid-height, independent of the panel's own top anchor. */
.showcase-studio__panel-toggle {
  position: fixed;
  top: 42vh;
  left: var(--panel-left);
  z-index: 46;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 2.75rem;
  color: rgb(100 116 139);
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-left: none;
  border-radius: 0 0.75rem 0.75rem 0;
  box-shadow: 2px 2px 8px rgba(15, 23, 42, 0.08);
  transition: left 0.3s ease, color 0.2s ease, background 0.2s ease;
}

.showcase-studio__panel-toggle.is-open {
  left: calc(var(--panel-left) + 320px);
}

.showcase-studio__panel-toggle:hover {
  color: rgb(51 65 85);
  background: rgb(248 250 252);
}

.showcase-studio__panel-backdrop {
  display: none;
}

/* Below the app's own desktop-sidebar breakpoint (`lg`, matches
   EventNavigationTabs.vue, whose icon rail hides here in favor of the mobile
   tab bar) the panel becomes a full-screen overlay from the true left edge
   instead of hugging a now-hidden sidebar, with a backdrop to close it. */
@media (max-width: 1023px) {
  .showcase-studio__panel-shell {
    left: 0;
    top: 0;
    height: 100vh;
    width: min(340px, 88vw);
    z-index: 60;
    /* No sidebar to clear here — just its own width. */
    transform: translateX(-100%);
    box-shadow: 4px 0 24px rgba(15, 23, 42, 0.15);
  }

  .showcase-studio__panel-toggle {
    left: 0;
    z-index: 61;
  }

  .showcase-studio__panel-toggle.is-open {
    left: min(340px, 88vw);
  }

  .showcase-studio__panel-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 59;
    background: rgba(15, 23, 42, 0.4);
  }
}

.showcase-preview-tab__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.showcase-preview-tab__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.showcase-preview-tab__subtitle {
  font-size: 0.875rem;
  color: rgb(100 116 139);
  margin-top: 0.25rem;
}

.showcase-preview-tab__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.showcase-preview-tab__templates-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(51 65 85);
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.showcase-preview-tab__templates-btn:hover {
  border-color: rgba(46, 204, 113, 0.4);
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.15);
}

/* Left-side floating controls: language toggle stacked above the vertical
   frame picker, anchored to whichever frame is currently on screen (via
   PreviewFrame's #leading slot, see template) — vertically centered on the
   phone mockup and sitting half outside its left edge. Replaces what used to
   be a row of per-language buttons plus a separate frame-tabs toolbar row
   above the frames, saving that vertical space. */
.showcase-preview-tab__frame-side-controls {
  position: absolute;
  left: -0.75rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

/* Normal pill chip — this sits in the gutter beside the frame (over the
   studio's own light page background, not over the frame's image), so it
   reads fine with regular slate-on-white styling. */
.showcase-preview-tab__lang-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgb(51 65 85);
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.1);
  transition: all 0.2s ease;
}

.showcase-preview-tab__lang-toggle:hover {
  border-color: rgba(46, 204, 113, 0.4);
  color: rgb(15 23 42);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
}

/* Frame picker: a minimal progress-dot timeline — dots joined by a thread,
   the active step filled with the brand gradient. No card chrome; it sits
   directly on the page background like the language pill above it. */
.showcase-preview-tab__frame-timeline {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.showcase-preview-tab__frame-step {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.showcase-preview-tab__frame-step-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 0.625rem;
  flex-shrink: 0;
}

.showcase-preview-tab__frame-step-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 9999px;
  background: white;
  border: 1.5px solid rgb(203 213 225);
  transition: all 0.2s ease;
}

.showcase-preview-tab__frame-step-line {
  width: 2px;
  flex: 1;
  min-height: 0.875rem;
  margin: 0.125rem 0;
  background: rgb(226 232 240);
}

.showcase-preview-tab__frame-step-label {
  padding: 0.375rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(148 163 184);
  white-space: nowrap;
  transition: color 0.2s ease;
}

.showcase-preview-tab__frame-step:hover .showcase-preview-tab__frame-step-label {
  color: rgb(71 85 105);
}

.showcase-preview-tab__frame-step.is-active .showcase-preview-tab__frame-step-dot {
  width: 0.625rem;
  height: 0.625rem;
  margin-top: calc(0.5rem - 1px);
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-color: transparent;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
}

.showcase-preview-tab__frame-step.is-active .showcase-preview-tab__frame-step-label {
  color: rgb(15 23 42);
  font-weight: 700;
}

.showcase-preview-tab__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 0;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-preview-tab__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid rgba(30, 144, 255, 0.2);
  border-bottom-color: #1e90ff;
  animation: showcase-preview-spin 0.8s linear infinite;
}

@keyframes showcase-preview-spin {
  to {
    transform: rotate(360deg);
  }
}

.showcase-preview-tab__error {
  padding: 2rem;
  text-align: center;
  color: rgb(220 38 38);
  background: rgba(254, 226, 226, 0.5);
  border-radius: 1rem;
}

.showcase-preview-tab__no-preview {
  padding: 3rem 0;
  text-align: center;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-studio__main {
  min-width: 0;
  padding: 0 1rem 1.5rem 1rem;
}

@media (min-width: 640px) {
  .showcase-studio__main {
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .showcase-studio__main {
    padding-left: 1.5rem;
    padding-right: 2rem;
    /* The panel is `position: fixed` (out of flow) — margin-left reserves
       the room for it so it doesn't overlap the frames, and animates in sync
       so the studio visibly "shrinks" as the panel slides out, matching the
       panel's own 0.3s transform transition. */
    margin-left: 0;
    transition: margin-left 0.3s ease;
  }

  .showcase-studio__main.is-shrunk {
    margin-left: 320px;
  }
}

.showcase-preview-tab__viewer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

/* Step-style segmented control: square icon buttons in a single connected
   pill, the active step filled with the brand gradient. */
.showcase-preview-tab__layout-switch {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 0.75rem;
}

.showcase-preview-tab__layout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.showcase-preview-tab__layout-btn:hover {
  color: rgb(51 65 85);
  background: rgba(255, 255, 255, 0.7);
}

.showcase-preview-tab__layout-btn.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
}

.showcase-preview-tab__frames {
  display: flex;
  flex-direction: column;
  /* stretch, not center: a centered flex item shrink-wraps to its own
     content width, which is circular with PreviewFrame measuring that same
     width to decide how big to render its content — and locks onto a wrong,
     tiny size the first time a frame that mounted hidden (display: none)
     gets shown. Stretching gives each frame a stable, real width to measure;
     PreviewFrame's own internal `align-items: center` still centers the
     (narrower, max-width-capped) phone mockup within it. */
  align-items: stretch;
  gap: 3rem;
  padding-bottom: 2rem;
}

.showcase-preview-tab__frames--cols-2,
.showcase-preview-tab__frames--cols-3 {
  display: grid;
  align-items: start;
  gap: 1.5rem;
}

.showcase-preview-tab__frames--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.showcase-preview-tab__frames--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* Not enough width for real phone-sized frames side by side below tablet
   width — fall back to single-column stacking instead of squeezing them. */
@media (max-width: 768px) {
  .showcase-preview-tab__frames--cols-2,
  .showcase-preview-tab__frames--cols-3 {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}

.showcase-preview-tab__transition-note {
  font-size: 0.8125rem;
  color: rgb(148 163 184);
  padding: 1.5rem 0;
}
</style>
